import job from './job.js'
import router from './router.js'
import registerHooks from './hooks.js'

module.exports = {
  job: job,
  hooks: registerHooks,
  router: router
}
