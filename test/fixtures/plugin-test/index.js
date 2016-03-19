module.exports = {
  job: require('./job.js'),
  hooks: require('./hooks.js'),
  router: require('./router.js'), 
  name: 'example',
  //allow key access on /p/example/
  allowKeyAccess: ['/']
}
