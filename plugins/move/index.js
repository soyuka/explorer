'use strict';
var router = require('./router.js')
var registerHooks = require('./hooks.js')
var job = require('./job.js')

module.exports = {
  hooks: registerHooks,
  router: router,
  job: job
}
