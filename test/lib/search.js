import {searchMethod} from '../../lib/search.js'
import p from 'path'
import fs from 'fs'

let fixtures = p.join(__dirname, '../fixtures/tree')

describe('search', function() {
  it('should throw', function() {
    try {
      searchMethod('nonexistant')       
    } catch(e) {
      expect(e).to.be.an.instanceof(TypeError) 
    }
  })

  it('should get the pt search method', function() {
    expect(searchMethod('pt')).to.be.a('function')
  })

  it('should get the ack search method', function() {
    expect(searchMethod('ack')).to.be.a('function')
  })

  it('should get the find search method', function() {
    expect(searchMethod('find')).to.be.a('function')
  })

  it('should get the mdfind search method', function() {
    expect(searchMethod('mdfind')).to.be.a('function')
  })

  it('should get the find search method (2)', function() {
    expect(searchMethod('custom')).to.be.a('function')
    expect(searchMethod('custom').toString()).to.equal(searchMethod('find').toString())
  })

  it('should get the custom method', function() {
    var custom = searchMethod('custom', { 
      search: {
        command: 'grep -l ${search} .'
      }
    })

    expect(custom.toString()).to.not.equal(searchMethod('find').toString())
  })

  it('should get the native search method', function() {
    expect(searchMethod('native')).to.be.a('function')
  })

  it('should native search smart caps', function(cb) {
   searchMethod('native')('lowercamelcase', fixtures, fixtures)
   .then(function(results) {
     var found = false
     //in case there are more than 1 results with upcoming tests
     for(let i in results.tree) {
       if(results.tree[i].name == 'lowerCamelCase') {
          found = true 
          break;
       }
     }

    expect(found).to.be.true
    cb()
   })
  })

  it('should search with -dir filter', function(cb) {
   searchMethod('native')('dir1 --dir', fixtures, fixtures)
   .then(function(results) {
     for(var i in results.tree) {
       expect(results.tree[i].directory).to.be.true
     }
      cb()
   })
  })
})
