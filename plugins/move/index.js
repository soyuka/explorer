"use strict";
var router = require('./router.js')
var registerHooks = require('./hooks.js')

module.exports = {
  hooks: registerHooks,
  router: router
}
