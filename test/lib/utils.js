'use strict';
var utils = require('../../lib/utils.js')
var resolveSources = require('../../lib/resolveSources.js')
var p = require('path')
var resolveFixture = function(f) {
  return p.join(__dirname, '../fixtures/tree', f)
}

describe('utils', function() {
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

  it('should resolve file paths', function() {
    resolveSources({
      files: ['dirfile', 'dummy.txt']
              .map(resolveFixture),
      directories: ['dir', 'dir2', 'dir3']
              .map(resolveFixture),
    }, {root: p.join(__dirname, '../fixtures/tree')})
    .then(function(result) {

expect(result).to.deep.equal([{ paths: [ '/Users/soyuka/explorer/test/fixtures/tree/dirfile' ],
    base: '/Users/soyuka/explorer/test/fixtures/tree' },
  { paths: [ '/Users/soyuka/explorer/test/fixtures/tree/dummy.txt' ],
    base: '/Users/soyuka/explorer/test/fixtures/tree' },
  { paths:
     [ '/Users/soyuka/explorer/test/fixtures/tree/dir/1Mo.dat',
       '/Users/soyuka/explorer/test/fixtures/tree/dir/someotherfile' ],
    base: '/Users/soyuka/explorer/test/fixtures/tree' },
  { paths: [ '/Users/soyuka/explorer/test/fixtures/tree/dir2/2Mo.dat' ],
    base: '/Users/soyuka/explorer/test/fixtures/tree' },
  { paths:
     [ '/Users/soyuka/explorer/test/fixtures/tree/dir3/2Mo.dat',
       '/Users/soyuka/explorer/test/fixtures/tree/dir3/dir/2Mo.dat' ],
    base: '/Users/soyuka/explorer/test/fixtures/tree' } ]
  )
    })
  })
})
