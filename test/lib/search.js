'use strict';
var p = require('path')
var fs = require('fs')

var fixtures = p.join(__dirname, '../fixtures/tree')

var search = require('../../lib/search/search.js')

function hasItems(items, name) {
   var found = false
   //in case there are more than 1 results with upcoming tests
   for(let i in items) {
     if(items[i].name == name) {
        found = true 
        break;
     }
   }

  expect(found).to.be.true
}

describe('search', function() {
  it('should search', function(cb) {
    search('dir', fixtures, {root: fixtures}) 
    .then(function(paths) {
      expect(paths.tree).to.be.an('array')
       hasItems(paths.tree, 'dirfile')
      cb()
    })
  })

  it('should search for exact match', function(cb) {
    search('dirfile -exact', fixtures, {root: fixtures}) 
    .then(function(paths) {
       expect(paths.tree).to.be.an('array')
       expect(paths.tree).to.have.length.of(1)
       hasItems(paths.tree, 'dirfile')
      cb()
    })
  })

  it('should search within path', function(cb) {
    var dir = p.join(fixtures, 'dir')
    search('*.dat', dir, {root: fixtures}) 
    .then(function(paths) {
      expect(paths.tree).to.be.an('array')
      expect(paths.tree).to.have.length.of(1)
      expect(paths.tree[0].ext).to.equal('.dat')
      cb()
    })
  })

  it('should native search smart caps', function(cb) {
   search('lowercamelcase', fixtures, {root: fixtures})
   .then(function(results) {
     hasItems(results.tree, 'lowerCamelCase')
    cb()
   })
  })

  it('should search with -dir filter', function(cb) {
   search('dir -dir', fixtures, {root: fixtures})
   .then(function(results) {
     for(let i in results.tree) {
       expect(results.tree[i].directory).to.be.true
     }
      cb()
   })
  })

  it('should search with -dir filter (with values after filter)', function(cb) {
   search('-dir *.dat', fixtures, {root: fixtures})
   .then(function(results) {
     expect(results.tree).to.have.length.of(0)
     cb()
   })
  })
})
