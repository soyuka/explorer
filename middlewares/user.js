import HTTPError from '../lib/HTTPError.js'

let debug = require('debug')('explorer:middlewares:user')

/**
 * Middleware that handles the user cookie
 * on error end @see HTTPError
 * on success populates req.user 
 */
function user(req, res, next) {

    let user = req.cookies.user

    if((!user || !user.username) && req.query.key) {
      user = req.user = req.users.getByKey(req.query.key) 
      
      if(!req.user) {
        return res.status(401).send('Key is not valid')
      }
    }

    if(req.url != '/login' && (!user || !user.username)) {
      return next(new HTTPError("Not authenticated", 401, '/login'))
    } 
    
    if(user && user.username && !req.user) {
      req.user = req.users.get(user.username)

      //has a bad cookie
      if(!req.user) {
        res.cookie('user', {}, util._extend({}, {httpOnly: false}, {expires: -1}))
        return next(new HTTPError("Bad cookie", 400, '/login'))
      }
    }

    res.locals.user = {}

    if(req.user) {
      for(let i in req.user) {
        if(i != 'password')
          res.locals.user[i] = req.user[i]
      }
    }

    debug('User %o', user)

    return next()
  }

export {user}
