'use strict';
var p = require('path')
var fs = require('fs')

describe('hook', function() {

  before(function(cb) {
    var self = this

    bootstrap.createAgent({disable_plugins: true}, function(r) {
      self.request = r
      return cb()
    })
  })

  before(bootstrap.login)

  it('should get hooks', function(cb) {
    this.request.get('/hooks/above/template')
    .expect(function(res) {
      expect(res.text).to.equal('above')
    })
    .end(cb)
  })

  it('should get scope', function(cb) {
    const user = this.user

    this.request.get('/hooks/above/scope')
    .expect(function(res) {
      expect(res.body['plugin-test']).not.to.be.undefined
      expect(res.body['plugin-test']).to.have.property('user')
      delete res.body['plugin-test'].user.iat
      expect(res.body['plugin-test'].user).to.deep.equal(user)
    })
    .end(cb)
  })

  after(bootstrap.logout)
})
