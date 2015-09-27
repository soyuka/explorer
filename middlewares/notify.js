"use strict";
var interactor = require('../lib/job/interactor.js')
var util = require('util')
var moment = require('moment')

var debug = require('debug')('explorer:middlewares:notify')

/**
 * Notify middlewares
 * Calls every ipc plugin for the `info` method
 * Sets res.locals.notifications to an array of plugins and the user notifications
 */
function notify(req, res, next) {
    
  if(!interactor.ipc) {
    debug('No interactor')
    res.locals.notifications = {num: 0}
    return next()
  }

  interactor.ipc.once('info:get', function(data) {

    debug('Notifications %o', data)

    var num = 0
    var user_data = {}

    if(!req.user) {
      res.locals.notifications = {num: num}
      return next()
    }

    var notifications = {}
    var username = req.user.username

    for(let plugin in data) {
      if(typeof data[plugin] == 'object') {
        if(username in data[plugin]) {
          num += Object.keys(data[plugin][username]).length
          user_data[plugin] = data[plugin][username]

          for(let i in user_data[plugin]) {
            user_data[plugin][i].fromNow = moment(user_data[plugin][i].time).fromNow()
          }

        } else {
          user_data[plugin] = {} 
        }
      }
    }

    debug('User notifications %o', user_data)

    res.locals.notifications = util._extend({num: num}, user_data)

    return next()
  })

  interactor.ipc.send('get', 'info')
}

module.exports = notify
