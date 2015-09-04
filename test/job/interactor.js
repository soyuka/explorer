
import interactor from '../../lib/job/interactor.js'

describe('interactor', function() {
  it('should run', function(cb) {
    this.timeout(5000)
    interactor.run([__dirname + '/../fixtures/testjob']) 
    .then(function(plugins) {
      expect(plugins).to.deep.equal(['testjob'])
      return cb()
    })
  })

  it('should send a message', function(cb) {
    interactor.ipc.send('call', 'testjob.answer', 'foo')

    interactor.ipc.once('answer', function(d) {
     expect(d).to.equal('foo')
     cb()
    })
  })
  
  // it('should get a long answer', function(cb) {
  //   this.timeout(2500)
  //   interactor.ipc.send('command', 'testjob.longAnswer', 'foo')
  //
  //   interactor.ipc.once('longanswer', function(d) {
  //    expect(d).to.equal('foo')
  //    cb()
  //   })
  // })

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
    interactor.run([__dirname + '/../fixtures/testjob']) 
    interactor.ipc.once('job.start', function(plugins) {
      return cb() 
    })
  })

  after(function(cb) {
   interactor.kill() 
   interactor.once('exit', cb)
  })
})
