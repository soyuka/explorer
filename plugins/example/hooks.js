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
    below: function(tree, path) {
    },
    above: function(tree, path) {
    },
    action: function(tree) {
    },
    element: function() {
    },
    menu: function() {
    }
  }
}

module.exports = registerHooks
