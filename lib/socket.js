'use strict';
var faye = require('faye')
var crypto = require('crypto')

module.exports = function(server, app) {
  var bayeux = new faye.NodeAdapter({mount: '/socket', timeout: 45})
  bayeux.attach(server)

  var users = app.get('users')
  var config = app.get('config')

  var hmac   = crypto.createHmac('sha256', config.session_secret);
  var token  = hmac.update('internal').digest('hex');

  bayeux.addExtension({
    incoming: function(message, callback) {

      if(!message.channel.match(/^\/meta\//)) {
        //internal message
        if(message.ext && message.ext.key === token)
          return callback(message)

        message.error = '403::Not authorized' 
        return callback(message)
      }

      if(message.channel === '/meta/subscribe') {
        if(!message.ext || !message.ext.key) {
          message.error = '403::Not authorized' 
          return callback(message)
        }

        let user = users.getByKey(message.ext.key)
        if(!user) {
          message.error = '401::Not authenticated' 
        }

        if(message.subscription !== '/notify/' + user.username) {
          message.error = '403::Subscription not authorized' 
        }
      }

      return callback(message)
    }
  })

  //logger
  bayeux.addExtension({
    incoming: function(message, callback) {
      if(message.error) 
        console.error(message.error)

      return callback(message)
    }
  })

  var client = bayeux.getClient()

  client.addExtension({
    outgoing: function(message, callback) {
      message.ext = message.ext || {}
      message.ext.key = token 
      return callback(message)
    } 
  })

  return client
}
