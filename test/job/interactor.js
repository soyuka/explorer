"use strict";

var interactor = require('../../lib/job/interactor.js')

describe('interactor', function() {
  it('should run', function(cb) {
    this.timeout(5000)
    interactor.run([__dirname + '/../fixtures/testjob'], bootstrap.config) 
    .then(function(plugins) {
      expect(plugins).to.deep.equal(['testjob'])
      return cb()
    })
  })

  it('should send a message (call)', function(cb) {
    interactor.ipc.send('call', 'testjob.answer', 'foo')

    interactor.ipc.once('answer', function(d) {
     expect(d).to.equal('foo')
     cb()
    })
  })
  
  it('should get a long answer (call)', function(cb) {
    this.skip()
    this.timeout(2500)
    interactor.ipc.send('call', 'testjob.longAnswer', 'foo')

    interactor.ipc.once('longanswer', function(d) {
     expect(d).to.equal('foo')
     cb()
    })
  })

  it('should get a value', function(cb) {
    interactor.ipc.send('get', 'testjob.info')  

    interactor.ipc.once('testjob:info', function(d) {
      expect(d).to.equal('info') 
      return cb()
    })
  })

  it('should get a notification', function(cb) {
    interactor.ipc.send('call', 'testjob.notify')  

    interactor.ipc.once('notify:test', function(d) {
      expect(d).to.have.deep.property('[0].foo', 'bar')
      expect(d).to.have.deep.property('[0].time')
      return cb()
    })
  })

  it('should get an error because notify without username', function(cb) {
    interactor.ipc.send('call', 'testjob.notifyfail')  

    interactor.once('error', function(d) {
      expect(d).to.equal("Can't notify without a username")
      return cb()
    })
  })

  it('should throw because running', function(cb) {
    try {
      interactor.run() 
    } catch(e) {
      expect(e).to.be.an.instanceof(ReferenceError)
      cb() 
    }
  })

  it('should kill', function(cb) {
   interactor.kill() 
   interactor.once('exit', cb)
  })

  it('should run again', function(cb) {
    interactor.run([__dirname + '/../fixtures/testjob'], bootstrap.config) 
    interactor.ipc.once('job.start', function(plugins) {
      return cb() 
    })
  })

  after(function(cb) {
   interactor.kill() 
   interactor.once('exit', cb)
  })
})
