function Router(router, job, utils, config) {
  router.get('/', function(req, res, next) {
    return res.send('ok') 
  })

  return router
}

module.exports = Router
