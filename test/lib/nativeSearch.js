var p = require('path')

import {nativeSearch} from '../../lib/nativeSearch.js'

describe('nativeSearch', function() {
  it('should search', function(cb) {
    nativeSearch()('dir', p.resolve(__dirname, '../fixtures/tree')) 
    .then(function(paths) {
      expect(paths).to.be.an('array')
      expect(paths).to.have.length.of(4)
      cb()
    })
  })
})
