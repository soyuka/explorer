function Testjob(ipc) {
  if(!(this instanceof Testjob)) return new Testjob(ipc)

  this.ipc = ipc
}

Testjob.prototype.answer = function(data = {}) {
    this.ipc.send('answer', data)
}

Testjob.prototype.longAnswer = function(data = {}) {
  let self = this
  return setTimeout(function() {
    self.ipc.send('longanswer', data) 
  }, 2000)
}

export default Testjob
