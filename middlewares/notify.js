import interactor from '../lib/job/interactor.js'

function notify(req, res, next) {
    
  interactor.ipc.send('info')

  interactor.ipc.once('info', function(data) {
    res.locals.notifications = data
    return next()
  })
}

export default notify
