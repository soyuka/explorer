var fork = require('child_process').fork
var expect = require('chai').expect
var p = require('path')
var IPCEE = require('../index.js')
var client, server

describe('IPCEE', function() {
  
  it('should throw because ipc is not available', function(cb) {
    try {
      IPCEE({foo: 'bar'})  
    } catch(err) {
      expect(err.message).to.equal('IPC is not enabled') 
      cb()
    }
  })

  it('should fork', function() {
    server = fork(p.join(__dirname, './fixtures/answer.js'))
    client = IPCEE(server)
  })

  it('should get message through client', function(cb) {
   client.once('test', function(x, y) {
     expect(x).to.deep.equal({foo: 'bar'})
     expect(y).to.deep.equal([0,1,2])
    cb() 
   }) 

   client.send('test', {foo: 'bar'}, [0,1,2])
  })

  it('should not be available because child has been killed', function(cb) {
   server.kill()

   server.once('exit', function() {
     expect(client.client).to.be.undefined
     cb()
   })

  })

  it('should fork server', function(cb) {
   server = fork(p.join(__dirname, './fixtures/server.js'))
   client = IPCEE(server)

   client.once('started', cb)
  })

  it('should ping-pong', function(cb) {
    client.once('pong', cb)

    client.send('ping')
  })

  it('should get exit event', function(cb) {
    server.kill()
    client.once('exit', cb)
  })

  it('should get error event', function(cb) {
   server = fork(p.join(__dirname, './fixtures/throw.js'))
   client = IPCEE(server)

   client.on('error', function(err, stack) {
       expect(err).to.equal('Error: Test')
       expect(stack).to.be.a.string
      return cb() 
   })
  })


})
