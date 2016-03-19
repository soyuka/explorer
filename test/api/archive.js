'use strict';
var p = require('path')
var fs = require('fs')
var rimraf = require('rimraf')
var async = require('async')
var interactor = bootstrap.interactor

var archive_path = p.join(__dirname, '../fixtures/tmp')
var list

function getList() {
  list = fs.readdirSync(archive_path)
    .filter(function(a) { return !/^\./.test(a)})
  return list
}

describe('archive', function() {

  before(bootstrap.autoAgent)
  before(bootstrap.login)

  it('should post file', function(cb) {
    var getNotification = function(notifications) {
      expect(getList()).to.deep.equal(['test.zip'])
      return cb()
    }

    this.timeout(5000)
    this.request.post('/tree')
    .send({'path': p.join(__dirname, '../fixtures/tree/dir/1Mo.dat'), name: 'test', action: 'archive.compress'})
    .end(function() {
      bootstrap.worker.once('archive:notify', getNotification)
    })
  })

  it('should post and get file stream', function(cb) {
    this.timeout(5000)
    this.request.post('/tree')
    .send({'path': p.join(__dirname, '../fixtures/tree/dir'), name: 'test2', action: 'archive.download'})
    .expect('Content-Type', /zip/)
    .expect('Content-disposition', /test2/)
    .expect('Transfer-Encoding', /chunked/)
    .end(cb)
  })

  it('should delete notifications', function(cb) {
    this.request.delete('/notifications')
    .end(cb)
  })

  after(function(cb) {
    return async.each(getList(), function(f, next) {
      return rimraf(p.join(archive_path, f), next)
    }, cb)
  })

  after(bootstrap.logout)
})
