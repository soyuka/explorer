'use strict'
const sanitizeCheckboxes = require('../../middlewares/sanitizeCheckboxes.js')
const p = require('path')

var resolveFixture = function(f) {
  return p.join(__dirname, '../fixtures/tree', f)
}

describe('sanitizeCheckboxes', function() {
  it('should get files and directories', function(cb) {
    let req = {
      body: {
        path: ['dir', 'dir2', 'dirfile', 'dummy.txt', 'dir3']
              .map(resolveFixture)
      },
      options: {root: p.join(__dirname, '../fixtures/tree')}
    }

    sanitizeCheckboxes(req, {}, function() {
      expect(req.options.directories).to.deep.equal(
        ['dir', 'dir2', 'dir3'].map(resolveFixture)
      )
      expect(req.options.files).to.deep.equal(
        ['dirfile', 'dummy.txt'].map(resolveFixture)
      )

      cb()
    })
  }) 
})
