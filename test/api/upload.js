'use strict';
var p = require('path')
var fs = require('fs')
var rimraf = require('rimraf')
var async = require('async')
var interactor = bootstrap.interactor

var upload_path = p.join(__dirname, '../fixtures/upload')
var list

function getList() {
  list = fs.readdirSync(upload_path)
    .filter(function(a) { return !/^\./.test(a)})
  return list
}

describe('upload', function() {

  before(bootstrap.autoAgent)
  before(bootstrap.login)
  before(bootstrap.runInteractor([p.resolve(__dirname, '../../plugins/upload')]))

  it('should get upload', function(cb) {
    this.request.get('/p/upload')
    .end(cb)
  })

  it('should post file', function(cb) {
    this.request.post('/p/upload')
    .attach('files', p.join(__dirname, '../fixtures/tree/dir/1Mo.dat'))
    .end(function() {
      expect(getList()).to.deep.equal(['1Mo.dat'])

      return cb()
    })
  })

  it('should post same file without replacing', function(cb) {
    this.request.post('/p/upload')
    .attach('files', p.join(__dirname, '../fixtures/tree/dir/1Mo.dat'))
    .end(function() {
      expect(getList()).to.have.length.of(2)
      return cb()
    })
  })

  it('should post remote-upload', function(cb) {
    var getNotification = function(notifications) {
      if(notifications.length < 2) { return }
      expect(getList()).to.have.length.of(3)
      interactor.ipc.removeListener('notify:admin', getNotification)
      return cb()
    }

    this.timeout(5000)
    this.request.post('/p/upload/remote')
    .send({links: 'https://www.google.fr/images/srpr/logo11w.png'})
    .expect(201)
    .end(function() {
      interactor.ipc.addListener('notify:admin', getNotification)
    })
  })

  it('should get notifications', function(cb) {
    this.request.get('/notifications')
    .expect(function(res) {
      expect(res.body.notifications.num).to.eql(2)
      expect(res.body.notifications.upload).to.be.an('array')
      expect(res.body.notifications.upload).to.have.length.of(2)
      expect(res.body.notifications.upload[0]).to.have.property('fromNow')
    })
    .end(cb)
  })

  it('should delete notifications', function(cb) {
    this.request.delete('/notifications')
    .end(cb)
  })

  it('should get no notifications', function(cb) {
    this.request.get('/notifications')
    .expect(function(res) {
      expect(res.body.notifications.num).to.eql(0)
    })
    .end(cb)
  })
  after(function(cb) {
    return async.each(getList(), function(f, next) {
      return rimraf(p.join(upload_path, f), next)
    }, cb)
  })

  after(bootstrap.logout)
  after(bootstrap.removeAgent)
  after(bootstrap.killInteractor())
})
