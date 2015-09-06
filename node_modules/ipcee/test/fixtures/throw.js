var IPCEE = require('../../')
var ipc = IPCEE(process)

process.on('uncaughtException', function(err) {
  ipc.send('error', err.toString(), err.stack)

  process.nextTick(function() {
    process.exit(1) 
  })
})

throw new Error('Test')

