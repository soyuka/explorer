'use strict';
var Filters = require('../../lib/search/filters.js')
var f = new Filters()
var moment = require('moment')

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

  it('it should parse short time filter', function() {

    var data = [
      {name: 'foo', mtime: Date.now()},
      {name: 'bar', mtime: moment().subtract('1', 'd').add('5', 'h')},
      {name: 'foobar', mtime: moment().subtract('2', 'd')},
    ]

    f.parse('--mtime=1d')

    expect(f.filter(data[0], 'test')).to.be.null
    expect(f.filter(data[1], 'test')).to.be.null
    expect(f.filter(data[2], 'test')).to.be.false
  })

  it('it should parse date interval', function() {

    var data = [
      {name: 'foo', mtime: moment('2015-10-12')},
      {name: 'bar', mtime: moment('2015-10-13').add('1', 'h')},
      {name: 'foobar', mtime: moment('2015-10-14').subtract('1', 'h')},
      {name: 'barfoo', mtime: moment('2015-10-15')},
    ]

    f.parse('--mtime=>2015-10-13 --mtime=<2015-10-14')

    expect(f.filter(data[0], 'test')).to.be.false
    expect(f.filter(data[1], 'test')).to.be.null
    expect(f.filter(data[2], 'test')).to.be.null
    expect(f.filter(data[3], 'test')).to.be.false
  })
})
