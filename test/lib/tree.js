'use strict';
var p = require('path')

var tree = require('../../lib/tree.js')

describe('tree', function() {

  var fixture = p.join(__dirname, '../fixtures/tree')

  it('should get the tree', function(cb) {
    tree(fixture, {root: __dirname})
    .then(function(o) {
      expect(o.tree).to.have.length.of.at.least(4)

      var dir = o.tree.find(e => e.name == 'dir')
      expect(dir.depth).to.equal(1)
      expect(dir.directory).to.be.true
      expect(dir.type).to.equal('directory')
      expect(dir.size).to.be.above(1000000)

      var dir3 = o.tree.find(e => e.name == 'dir3')
      expect(dir3.depth).to.equal(2)
      expect(dir3.directory).to.be.true
      expect(dir3.type).to.equal('directory')
      expect(dir3.size).to.be.above(4000000)

      var dummy = o.tree.find(e => e.name == 'dummy.txt')
      expect(dummy.type).to.equal('text')

      cb() 
    })
    .catch(cb)
  })

  it('should get pagination tree', function(cb) {
    tree(fixture, {page: 1, limit: 2, root: __dirname}) 
    .then(function(o) {
      expect(o.tree).to.have.length.of(2)
      expect(o.options.pages).to.be.at.least(2)

      tree(fixture, {page: 2, limit: 2})
      .then(function(o) {
        expect(o.tree).to.have.length.of(2)
        expect(o.options.pages).to.be.at.least(2)
        cb()
      })
      .catch(cb)
    })
    .catch(cb)
  })
})
