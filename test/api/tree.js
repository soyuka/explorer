'use strict';
var fs = require('fs')
var p = require('path')
var existsSync = require('../../lib/utils.js').existsSync

var newName

function testSort(params, modifiers, cb) {
  var url = '/'
  var start = true
  var previous = modifiers.previous

  for(let i in params) {
    var s = i +'='+ params[i]
    url += start === true ? '?' + s : '&' + s
    
    if(start === true)
      start = false
  }

  return this.request.get(url)
  .expect(function(res) {
      expect(res.body.tree).to.be.an.array
      expect(res.body.breadcrumb).to.be.an.array
      expect(res.body.breadcrumb).to.have.length.of(1)

      for(let i in res.body.tree) {
        var p = res.body.tree[i][modifiers.property]
        p = typeof modifiers.modify == 'function' ? modifiers.modify(p) : p

        expect(p).to.be.at[modifiers.direction == 'asc' ? 'most' : 'least'](previous)

        previous = p
      }
  })
  .end(cb)
}

describe('tree', function() {
  before(bootstrap.autoAgent)
  before(bootstrap.login)

  it('should get tree', function(cb) {
    this.request.get('/')
    .expect(function(res) {
      expect(res.body.tree).to.be.an.array
      expect(res.body.breadcrumb).to.be.an.array
      expect(res.body.breadcrumb).to.have.length.of(1)
    })
    .end(cb)
  })

  it('should get deepest tree', function(cb) {
    this.request.get('/?path=dir')
    .expect(function(res) {
      expect(res.body.tree).to.be.an.array
      expect(res.body.breadcrumb).to.be.an.array
      expect(res.body.breadcrumb).to.have.length.of(2)
    })
    .end(cb)
  })

  it('should get tree sorted by time asc', function(cb) {
    testSort.call(this, {sort: 'time', order: 'asc' }, {
      property: 'mtime',
      direction: 'asc',
      previous: Infinity
    }, cb)
  })

  it('should get tree sorted by time desc', function(cb) {
    testSort.call(this, {sort: 'time', order: 'desc' }, {
      property: 'mtime',
      direction: 'desc',
      previous: 0
    }, cb)
  })

  it('should get tree sorted by name asc', function(cb) {
    testSort.call(this, {sort: 'name', order: 'asc' }, {
      property: 'name',
      direction: 'asc',
      modify: function(p) {
        return p.charCodeAt(0) 
      },
      previous: Infinity
    }, cb)
  })

  it('should get tree sorted by name desc', function(cb) {
    testSort.call(this, {sort: 'name', order: 'desc' }, {
      property: 'name',
      direction: 'desc',
      modify: function(p) {
        return p.charCodeAt(0) 
      },
      previous: 0
    }, cb)
  })

  it('should get tree sorted by size asc', function(cb) {
    testSort.call(this, {sort: 'size', order: 'asc' }, {
      property: 'size',
      direction: 'asc',
      previous: Infinity
    }, cb)
  })

  it('should get tree sorted by size desc', function(cb) {
    testSort.call(this, {sort: 'size', order: 'desc' }, {
      property: 'size',
      direction: 'desc',
      previous: 0
    }, cb)
  })
  
  var l = 0

  it('should get tree length', function(cb) {
    this.request.get('/?limit=1000&page=1')
    .expect(function(res) {
      expect(res.body.tree).to.be.an.array
      l = res.body.tree.length
    })
    .end(cb)
  })

  it('should get 5 tree elements', function(cb) {
    this.request.get('/?limit='+l)
    .expect(function(res) {
      expect(res.body.pages).to.equal(1)
      expect(res.body.tree).to.have.length.of(l)
    })
    .end(cb)
  })

  it('should limit tree by 1', function(cb) {
    this.request.get('/?limit=1')
    .expect(function(res) {
      expect(res.body.tree).to.have.length.of(1)
      expect(res.body.pages).to.equal(l)
    })
    .end(cb)
  })

  it('should delete a file (trash)', function(cb) {
    function getNotification() {
      expect(existsSync(__dirname + '/../fixtures/tree/trash/somefile')).to.be.true
      cb()
    }

    bootstrap.worker.task('move')
    .once('move:moved', getNotification)

    fs.writeFileSync(__dirname + '/../fixtures/tree/tobedeleted/somefile', 'somecontent');
    this.request.get('/remove?path=tobedeleted/somefile')
    .expect(201)
    .end(function() {})
  })

  it('should not delete a file (trash)', function(cb) {
    this.request.get('/remove?path=trash/somefile')
    .expect(406)
    .end(cb)
  })


  it('should empty trash', function(cb) {
    function getNotification() {
      expect(fs.readdirSync(__dirname + '/../fixtures/trash')).to.have.length.of(1)
      cb()
    }

    bootstrap.worker.task('move')
    .once('move:removed', getNotification) 

    this.request.post('/trash')
    .expect(201)
    .end(function() {})
  })

  it('should serve a picture', function(cb) {
    this.request.get('/download?path=favicon.ico')
    .expect('Content-type', 'image/x-icon')
    .end(cb)
  })

  it('should download a file', function(cb) {
    this.request.get('/download?path=dir/1Mo.dat')
    .expect('Content-disposition', /1Mo\.dat/)
    .end(cb)
  })

  it('should download a file', function(cb) {
    this.request.get('/download?path=\'[special,]')
    .expect('Content-disposition', /'\[special,\]/)
    .end(cb)
  })

  it('should fail downloading an inexistant file', function(cb) {
    this.request.get('/download?path=somenonexistantpath')
    .expect(500)
    .end(cb)
  })

  it('should fail downloading a directory', function(cb) {
    this.request.get('/download?path=dir')
    .expect(400)
    .end(cb)
  })

  it('should delete notifications', function(cb) {
    this.request.delete('/notifications')
    .end(cb)
  })

  after(bootstrap.logout)
})
