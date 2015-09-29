"use strict";
var Promise = require('bluebird')
var mem;
var mem2;

module.exports = function(name, handler, args) {
  describe(name, function() {

    it('should fail creating an instance', function() {
      try {
        mem = new handler()
      } catch(e) {
        expect(e).to.be.an.instanceof(TypeError) 
        expect(e.message).to.equal('Cache needs a namespace, none given')
      }
    })

    it('should create instance', function() {
      mem = handler.apply(handler, ['test'].concat(args)) 
    })

    it('should not store object', function() {
      return mem.put('test', {foo: 'bar'})
      .then(function() {
        throw new Error('It should catch an exception') 
      })
      .catch(function(e) {
        expect(e).to.be.an.instanceof(TypeError) 
        expect(e.message).to.equal('Key/value arguments must be strings')
      }) 
    })
    
    it('should store string', function() {
     return mem.put('foo', 'bar') 
    })

    it('should retreive string', function() {
      return mem.get('foo').then(function(d) {
        expect(d).to.equal('bar')
      })
    })

    it('should remove non-existant object', function() {
      return mem.remove('test').then(function(e) {
        expect(e).to.be.false
      })
    })

    it('should create a new instance', function() {
      mem2 = handler.apply(handler, ['test'].concat(args)) 
      mem.get('foo').then(function(v) {
        expect(v).to.equal('bar')
      })
    })

    it('should remove object', function() {
      return mem.remove('foo')
      .then(function(e) {
        expect(e).not.to.be.false
      })
    })

    it('should not retreive object', function() {
      return mem.get('foo')
      .then(function(e) {
        expect(e).to.equal(null)
      })
    })

    it('should store with a ttl', function() {
      return mem.put('foottl', 'disappear', 100) 
      .delay(200)
      .then(function() {
        return mem.get('foottl')
      })
      .then(function(e) {
        expect(e).to.equal(null) 
      })
    })
  })
}
