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
      return expect(mem.put('test', {foo: 'bar'}))
      .to.be.rejectedWith('Key/value arguments must be strings')
    })
    
    it('should store string', function() {
     return mem.put('foo', 'bar') 
    })

    it('should retreive string', function() {
      return expect(mem.get('foo')).to.eventually.equal('bar')
    })

    it('should remove non-existant object', function() {
      return expect(mem.remove('test')).to.eventually.be.false
    })

    it('should create a new instance', function() {
      mem2 = handler.apply(handler, ['test'].concat(args)) 
      return expect(mem.get('foo')).to.eventually.equal('bar')
    })

    it('should remove object', function() {
      return expect(mem.remove('foo')).not.to.eventually.be.false
    })

    it('should not retreive object', function() {
      return expect(mem.get('foo')).to.eventually.equal(null)
    })

    it('should store with a ttl', function() {
      return mem.put('foottl', 'disappear', 1) 
      .delay(1100)
      .then(function() {
        return expect(mem.get('foottl')).to.eventually.equal(null)
      })
    })
  })
}
