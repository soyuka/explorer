var job = require('./job.js')
var router = require('./router.js')
var registerHooks = require('./hooks.js')

module.exports = {
  job: job,
  hooks: registerHooks,
  router: router
}
