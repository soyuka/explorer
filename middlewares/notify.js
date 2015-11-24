'use strict';
var util = require('util')
var moment = require('moment')
var Promise = require('bluebird')

var debug = require('debug')('explorer:middlewares:notify')

function getNotify(app) {
  var plugins_cache = app.get('plugins_cache')

  /**
   * Notify middlewares
   * Calls every ipc plugin for the `info` method
   * Sets res.locals.notifications to an array of plugins and the user notifications
   */
  return function notify(req, res, next) {
      
    res.locals.notifications = {num: 0}

    if(!req.user)
      return next()

    var num = 0
    var notifications = {}

    for(let i in plugins_cache) {
      notifications[i] = plugins_cache[i].get(req.user.username)
    }

    return Promise.props(notifications)
    .then(function(notifications) {
      debug('Got user notifications %o', notifications)

      for(let i in notifications) {

        if(notifications[i]) {
          num += notifications[i].length
          
          for(let j in notifications[i]) {
            notifications[i][j].fromNow = moment(notifications[i][j].time).fromNow()
          }
        } else {
          notifications[i] = [] 
        }

      }

      res.locals.notifications = util._extend({num: num}, notifications)

      return next()
    })
  }
}

module.exports = getNotify
