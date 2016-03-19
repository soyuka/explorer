const Promise = require('bluebird')

/**
 * registerHooks
 * @param object config explorer configuration
 * @param object user user object
 * @param object utils {cache, notify}
 * @return string
 */
function registerHooks(config, user, utils) {
  return {
    //hooking on directory
    below: function() {
    },
    above: {
      template: 'above',
      scope: function(req, res) {
        return {user: req.user}
      }
    },
    action: function() {
    },
    element: function() {
    },
    menu: function() {
    }
  }
}

module.exports = registerHooks
