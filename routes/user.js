import util from 'util'

let debug = require('debug')('explorer:routes:user')

const cookieOptions = { httpOnly: false }

function home(req, res) {
  return res.renderBody('login.haml')
}

function logout(req, res) {
  res.cookie('user', {}, util._extend({}, cookieOptions, {expires: new Date()}))
  return res.redirect('/login')
}

function login(req, res) {

  if(!req.body.username || !req.body.password) {
    req.flash('error', 'One of the required fields is missing')
    return res.redirect('/login') 
  }

  req.users.authenticate(req.body.username, req.body.password)
  .then(function(ok) {

    debug('Auth %s', ok)
  
    if(ok) {
      let u = req.users.get(req.body.username)

      if(!u) {
        req.flash('error', `User ${req.body.username} does not exist`)
        return res.redirect('/login') 
      }

      debug('%s logged in', u)

      res.cookie('user', {username: u.username, home: u.home, rss: u.rss}, cookieOptions)

      return res.redirect('/')
    } 

    req.flash('error', `Wrong password`)
    return res.redirect('/login')
  })  
}

let User = function(app) {
  app.get('/logout', logout)
  app.get('/login', home)
  app.post('/login', login)

  return app
}

export {User}
