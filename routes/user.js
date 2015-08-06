import util from 'util'
import HTTPError from '../lib/HTTPError.js'
import interactor from '../lib/job/interactor.js'
import {handleSystemError} from '../lib/utils.js'

let debug = require('debug')('explorer:routes:user')

const cookieOptions = { httpOnly: false }

function home(req, res) {
  return res.renderBody('login.haml')
}

function logout(req, res) {
  res.cookie('user', {}, util._extend({}, cookieOptions, {expires: new Date()}))
  return res.handle('/login')
}

function login(req, res, next) {

  if(!req.body.username || !req.body.password) {
    return next(new HTTPError('One of the required fields is missing', 400, '/login'))
  }

  req.users.authenticate(req.body.username, req.body.password)
  .then(function(ok) {

    debug('Auth %s', ok)
  
    if(ok) {
      let u = req.users.get(req.body.username)

      debug('%s logged in', u)

      res.cookie('user', u.getCookie(), cookieOptions)

      return res.handle('/', u.getCookie())
    } 

    return next(new HTTPError('Wrong password', 401, '/login'))
  }) 
  .catch(function(e) {
    if(typeof e == 'string')
      return next(new HTTPError(e, 401, '/login'))
    else
      return handleSystemError(next)(e)
  })
}

function notifications(req, res, next) {
  return res.renderBody('notifications') 
}

function deleteNotifications(req, res, next) {
  
  if(!interactor.ipc) {
    debug('No interactor')
    return next(new HTTPError('No Interactor', 400))
  }

  interactor.ipc.once('clear', function(data) {

    debug('Remove notifications %o', data)

    req.flash('info', `${res.locals.notifications.num} notifications deleted`)
    return res.handle('/') 
  })

  interactor.ipc.send('clear', req.user.username)

}

let User = function(app) {
  app.get('/logout', logout)
  app.get('/login', home)
  app.get('/notifications', notifications)
  app.delete('/notifications', deleteNotifications)
  app.post('/login', login)

  return app
}

export {User}
