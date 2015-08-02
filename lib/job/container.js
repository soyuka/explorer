//workaround
//while forking with babel-node, ipc was not available

var p = require('path')

try {
  require('babel/register')
} catch(e) {}


require('./job.js')
