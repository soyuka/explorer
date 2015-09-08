import p from 'path'
import fs from 'fs'

let fixtures = p.join(__dirname, '../fixtures/tree')

import {nativeSearch} from '../../lib/nativeSearch.js'

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

describe('nativeSearch', function() {
  it('should search', function(cb) {
    nativeSearch()('dir', fixtures, fixtures) 
    .then(function(paths) {
      expect(paths.tree).to.be.an('array')
      cb()
    })
  })

  it('should search within path', function(cb) {
    let dir = p.join(fixtures, 'dir')
    nativeSearch()('*.dat', dir, fixtures) 
    .then(function(paths) {
      expect(paths.tree).to.be.an('array')
      console.log(paths.tree);
      expect(paths.tree).to.have.length.of(1)
      cb()
    })
  })

  it('should native search smart caps', function(cb) {
   nativeSearch()('lowercamelcase', fixtures, fixtures)
   .then(function(results) {
     hasItems(results.tree, 'lowerCamelCase')
    cb()
   })
  })

  it('should search with -dir filter', function(cb) {
   nativeSearch()('dir1 --dir', fixtures, fixtures)
   .then(function(results) {
     for(var i in results.tree) {
       expect(results.tree[i].directory).to.be.true
     }
      cb()
   })
  })
})
