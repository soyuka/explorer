'use strict';
function Testjob(ipc) {
  if(!(this instanceof Testjob)) return new Testjob(ipc)

  this.ipc = ipc
}

Testjob.prototype.answer = function(data) {
  this.ipc.send('answer', data)
}

Testjob.prototype.longAnswer = function(data) {
  var self = this
  return setTimeout(function() {
    self.ipc.send('longanswer', data) 
  }, 2000)
}

Testjob.prototype.notify = function() {
  this.ipc.send('testjob:notify', 'test', {foo: 'bar'})
}

Testjob.prototype.notifyfail = function(data) {
  this.ipc.send('testjob:notify', null)
}

Testjob.prototype.info = function() {
  return 'info'
}

module.exports = Testjob
