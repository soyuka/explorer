"use strict";
var Stat = require('../../lib/job/stat.js')

var stat;

describe('stat', function() {

  it('should fail creating an instance', function() {
    try {
      stat = new Stat()
    } catch(e) {
      expect(e).to.be.an.instanceof(TypeError) 
    }
  })


  it('should create instance', function() {
      stat = new Stat('plugin') 
  })

  it('should store user object', function() {
    stat.add('test', {foo: 'bar'})
  })
  
  it('should retreive user object', function() {
    expect(stat.get('test')).to.be.an('array')
    expect(stat.get('test')).to.have.deep.property('[0].foo', 'bar')
  })

  it('should retreive global object', function() {
    expect(stat.get()).to.have.deep.property('.test[0].foo', 'bar')
  })

  it('should add array user object', function() {
    stat.add('admin', [{foo: 'bar'}, {bar: 'foo'}])

    expect(stat.get('admin')).to.have.deep.property('[0].foo', 'bar')
    expect(stat.get('admin')).to.have.deep.property('[1].bar', 'foo')
  })

  it('should fail removing whole object', function() {
    try {
      stat.remove()
    } catch(e) {
      expect(e).to.be.an.instanceof(TypeError) 
    }
  })
  
  it('should remove object', function() {
    expect(stat.remove('test')).not.to.be.false
  })

  it('should have 1 object', function() {
    expect(Object.keys(stat.get())).to.have.length.of(1)
  })
})
