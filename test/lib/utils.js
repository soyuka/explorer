"use strict";
var utils = require('../../lib/utils.js')

describe('utils', function() {
  it('should secure string', function() {
    expect(utils.secureString('"\'\\&|;-')).to.equal('') 
  })

  it('should get higher path', function() {
    expect(utils.higherPath('/some/path', '/some')).to.equal('/some/path')
    expect(utils.higherPath('/some/path', '/some/path/../../')).to.equal('/some/path')
    expect(utils.higherPath('/some/path', '../../')).to.equal('/some/path')
    expect(utils.higherPath('/some/path', '/')).to.equal('/some/path')
  })

  it('should filter dot files', function() {
    expect(utils.noDotFiles('.DS_Store')).to.be.false
  })

  it('file should exists (sync)', function() {
    expect(utils.existsSync(__dirname + '/../fixtures/tree/dir')) .to.be.true
  })

  it('file should not exists (sync)', function() {
    expect(utils.existsSync(__dirname + '/../fixtures/tree/nonexistant')) .to.be.false
  })

  it('file should exists (async)', function() {
    return utils.exists(__dirname + '/../fixtures/tree/dir')
    .then(function(e) {
      expect(e).to.be.true
    })
  })

  it('file should not exists (async)', function() {
    return utils.exists(__dirname + '/../fixtures/tree/nonexistant')
    .then(function(e) {
      expect(e).to.be.false
    })
  })
})
