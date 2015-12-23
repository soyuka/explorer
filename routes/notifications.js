
'use strict'
const Promise = require('bluebird')
const util = require('util')
const moment = require('moment')

let Notifications = function(app, router) {
  const plugins_cache = app.get('plugins_cache')

  /**
   * @api {delete} /notifications Delete notifications
   * @apiGroup User
   * @apiName deleteNotifications
   */
  function deleteNotifications(req, res, next) {
    
    let notifications = {}

    for(let i in plugins_cache) {
      notifications[i] = plugins_cache[i].remove(req.user.username)
    }

    return Promise.props(notifications)
    .then(function(notifications) {
      return res.handle(notifications)
    })
  }

  /**
   * @api {get} /notifications Get notifications
   * @apiGroup User
   * @apiName getNotifications
   */
  function notifications(req, res, next) {
    let num = 0
    let notifications = []

    let promises = {}
    for(let i in plugins_cache) {
      promises[i] = plugins_cache[i].get(req.user.username)
    }

    return Promise.props(promises)
    .then(function(data) {
      for(let plugin in data) {
        for(let i in data[plugin]) {
          let d = data[plugin][i]
          d.fromNow = moment(d.time).fromNow()
          notifications.push(util._extend({type: plugin}, d))
          num++
        }
      }

      return res.handle({num: num, notifications: notifications})
    })
  }

  router.get('/notifications', notifications)
  router.delete('/notifications', deleteNotifications)
}

module.exports = Notifications
