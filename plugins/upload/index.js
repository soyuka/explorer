var job = require('./job.js')
var router = require('./router.js')
var registerHooks = require('./hooks.js')

module.exports = {
  hooks: registerHooks,
  job: job,
  router: router
}
