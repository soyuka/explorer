"use strict";
var Notify = require('../../lib/job/notify.js')

var notify;

describe('notify', function() {

  it('should fail creating an instance with no namespace', function() {
    try {
      notify = new Notify()
    } catch(e) {
      expect(e).to.be.an.instanceof(TypeError) 
    }
  })

  it('should create instance', function() {
      notify = new Notify('plugin', require('../../lib/cache/memory.js')) 
  })

  it('should store namespace object', function() {
    return notify.add('test', {foo: 'bar'})
  })
  
  it('should retreive namespace array', function() {
    return Promise.all([
      expect(notify.get('test')).to.eventually.be.an('array'),
      expect(notify.get('test')).to.eventually.have.deep.property('[0].foo', 'bar')
    ])
  })

  it('should not retreive global namespace', function() {
    return expect(notify.get()).to.be.rejectedWith('Accessing a whole memory instance through stat is not possible')
  })

  it('should add array to namespace', function() {
    return notify.add('admin', [{foo: 'bar'}, {bar: 'foo'}])
  })

  it('should retreive same array', function() {
    return Promise.all([
      expect(notify.get('admin')).to.eventually.have.deep.property('[0].foo', 'bar'),
      expect(notify.get('admin')).to.eventually.have.deep.property('[1].bar', 'foo')
    ])
  })

  it('should fail removing whole stack', function() {
      return expect(notify.remove()).to.be.rejectedWith('Removing a whole memory instance through stat is not possible')
  })
  
  it('should remove object', function() {
    return expect(notify.remove('test')).not.to.eventually.be.false
  })
})
