'use strict';
var Filters = require('../../lib/search/filters.js')
var f = new Filters()

describe('filters', function() {
  it('shold parse search', function() {

    f.parse('somestuf -e --dir')

    expect(f.filters).to.be.an.array
    expect(f.filters).to.have.length.of(2)

    for(let i in f.filters) {
      expect(f.filters[i].filter).to.be.a.function
    }
  })

  it('should filter file that matches search exactly', function() {
   expect(f.filter({name: 'test', path: '/foo', directory: false}, 'test')).to.be.false
  })

  it('should filter directory that matches exactly', function() {
   expect(f.filter({name: 'test', path: '/foo', directory: true}, 'test')).to.be.true
  })

  it('should filter directory by resulting null', function() {
    f.parse('somestuf --directory')
    expect(f.filter({name: 'test', path: '/foo', directory: true}, 'test')).to.be.null
  })

  it('should filter directory by resulting false', function() {
    expect(f.filter({name: 'test', path: '/foo', directory: false}, 'test')).to.be.false
  })
})
