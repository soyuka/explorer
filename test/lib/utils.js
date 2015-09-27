"use strict";
var utils = require('../../lib/utils.js')

describe('utils', function() {
  it('should secure string', function() {
    expect(utils.secureString('"\'\\&|;-')).to.equal('') 
  })

  it('should get higher path', function() {
    expect(utils.higherPath('/some/path', '/some')).to.equal('/some/path')
    expect(utils.higherPath('/some/path', '/some/path/../../')).to.equal('/some/path')
  })

  it('should filter dot files', function() {
    expect(utils.noDotFiles('.DS_Store')).to.be.false
  })
})
