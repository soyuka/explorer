var IPCEE = require('../../')

var ipc = IPCEE(process)

ipc.send('started')

ipc.on('ping', function() {
 ipc.send('pong') 
})
