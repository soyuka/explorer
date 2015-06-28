import {secureString, higherPath, noDotFiles} from '../../lib/utils.js'

describe('utils', function() {
  it('should secure string', function() {
    expect(secureString('"\'\\&|;-')).to.equal('') 
  })

  it('should get higher path', function() {
    expect(higherPath('/some/path', '/some')).to.equal('/some/path')
    expect(higherPath('/some/path', '/some/path/../../')).to.equal('/some/path')
  })

  it('should filter dot files', function() {
    expect(noDotFiles('.DS_Store')).to.be.false
  })
})
