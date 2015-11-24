'use strict';
var p = require('path')
var fs = require('fs')
var rimraf = require('rimraf')
var async = require('async')
var interactor = bootstrap.interactor

var fixtures = p.join(__dirname, '../fixtures/tree/move')
var move_path = p.join(__dirname, '../fixtures/tree/move/dest')
var items

function getList() {
  return fs.readdirSync(move_path)
    .filter(function(a) { return !/^\./.test(a)})
}

function url(u) {
  return p.join('/p/move', u)
}

function createFiles() {
  try {
    fs.mkdirSync(p.join(fixtures, 'dir'))
  } catch(e) {}
  fs.writeFileSync(p.join(fixtures, 'file.dat'), '')
  fs.writeFileSync(p.join(fixtures, 'dir/file.dat'), '')
}

function deleteFiles(cb) {
  async.each(getList(), function(f, next) {
    return rimraf(p.join(move_path, f), next)
  }, cb)
}

describe('move', function() {

  before(bootstrap.autoAgent)
  before(bootstrap.login)

  before(deleteFiles)
  before(createFiles)

  describe('copy', function() {
    
    it('should copy file and directory', function(cb) {
      this.request.post('/')
      .send({path: [
        p.join(fixtures, 'dir'),
        p.join(fixtures, 'file.dat'),
      ], action: 'move.copy'})
      .expect(201)
      .end(cb)
    })

    it('should has copy items in the clipboard', function(cb) {
      this.request.get(url('/'))
      .expect(function(res) {
        expect(res.body).to.be.an.array
        expect(res.body).to.have.length.of(2)
        expect(res.body).to.have.deep.property('[0].method', 'copy')
        expect(res.body).to.have.deep.property('[1].method', 'copy')
        items = res.body
      })
      .end(cb)
    })

    it('should paste in current path', function(cb) {
      items = items.map(function(e) {
        return e.method + '-' + e.path 
      })

      this.request.post(url('/?path='+move_path))
      .send({
        path: items
      })
      .expect(201)
      .end(function() {
        bootstrap.worker.once('move:copied', function() {
          let list = getList()
          expect(list).to.deep.equal(['dir', 'file.dat'])
          expect(fs.accessSync(p.join(move_path, 'dir/file.dat'))).to.be.undefined
          cb() 
        })
      })

    })

    it('clipboard should be empty', function(cb) {
      this.request.get(url('/'))
      .expect(function(res) {
        expect(res.body).to.be.an.array
        expect(res.body).to.have.length.of(0)
      })
      .end(cb)
    })

    it('should rename because it exists', function(cb) {
      var self = this

      this.request.post('/')
      .send({path: p.join(fixtures, 'file.dat'), action: 'move.copy'})
      .expect(201)
      .end(function() {
        self.request.post(url('/?path='+move_path))
        .send({
          path: 'copy-'+p.join(fixtures, 'file.dat')
        })
        .expect(201)
        .end(function() {
          bootstrap.worker.once('move:copied', function() {
            let list = getList()
            expect(list).to.have.length.of(3)
            cb() 
          })
        })
      })
    })

    it('should empty clipboard', function(cb) {
      var self = this

      this.request.post('/')
      .send({path: p.join(fixtures, 'file.dat'), action: 'move.copy'})
      .expect(201)
      .end(function() {
        self.request.get(url('/clean'))  
        .end(cb)
      })
    })

    it('clipboard should be empty', function(cb) {
      this.request.get(url('/'))
      .expect(function(res) {
        expect(res.body).to.be.an.array
        expect(res.body).to.have.length.of(0)
      })
      .end(cb)
    })

    it('should get notifications', function(cb) {
      this.request.get('/notifications')
      .expect(function(res) {
        expect(res.body.notifications.num).to.eql(2)
        expect(res.body.notifications.move).to.be.an('array')
        expect(res.body.notifications.move).to.have.length.of(2)
        expect(res.body.notifications.move[0]).to.have.property('fromNow')
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
      async.each(getList(), function(f, next) {
        return rimraf(p.join(move_path, f), next)
      }, cb)
    })
  })

  describe('cut', function() {
    
    it('should cut file and directory', function(cb) {
      this.request.post('/')
      .send({path: [
        p.join(fixtures, 'dir'),
        p.join(fixtures, 'file.dat'),
      ], action: 'move.cut'})
      .expect(201)
      .end(cb)
    })

    it('should has cut items in the clipboard', function(cb) {
      this.request.get(url('/'))
      .expect(function(res) {
        expect(res.body).to.be.an.array
        expect(res.body).to.have.length.of(2)
        expect(res.body).to.have.deep.property('[0].method', 'cut')
        expect(res.body).to.have.deep.property('[1].method', 'cut')
        items = res.body
      })
      .end(cb)
    })

    it('should paste in current path', function(cb) {
      items = items.map(function(e) {
        return e.method + '-' + e.path 
      })

      this.request.post(url('/?path='+move_path))
      .send({
        path: items 
      })
      .expect(201)
      .end(function() {
        bootstrap.worker.once('move:moved', function() {
          let list = getList()
          expect(list).to.deep.equal(['dir', 'file.dat'])
          expect(fs.accessSync(p.join(move_path, 'dir/file.dat'))).to.be.undefined
          cb() 
        })
      })
    })

    it('clipboard should be empty', function(cb) {
      this.request.get(url('/'))
      .expect(function(res) {
        expect(res.body).to.be.an.array
        expect(res.body).to.have.length.of(0)
      })
      .end(cb)
    })

    it('should get notifications', function(cb) {
      this.request.get('/notifications')
      .expect(function(res) {
        expect(res.body.notifications.num).to.eql(1)
        expect(res.body.notifications.move).to.be.an('array')
        expect(res.body.notifications.move).to.have.length.of(1)
        expect(res.body.notifications.move[0]).to.have.property('fromNow')
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

    after(deleteFiles)
    after(createFiles)
  })
  
  after(bootstrap.logout)
})
