import {searchMethod} from '../../lib/search.js'

describe('search', function() {
  it('should throw', function() {
    try {
      searchMethod('nonexistant')       
    } catch(e) {
      expect(e).to.be.an.instanceof(TypeError) 
    }
  })

  it('should get the pt search method', function() {
    expect(searchMethod('pt')).to.be.a('function')
  })

  it('should get the ack search method', function() {
    expect(searchMethod('ack')).to.be.a('function')
  })

  it('should get the find search method', function() {
    expect(searchMethod('find')).to.be.a('function')
  })

  it('should get the mdfind search method', function() {
    expect(searchMethod('mdfind')).to.be.a('function')
  })

  it('should get the find search method (2)', function() {
    expect(searchMethod('custom')).to.be.a('function')
    expect(searchMethod('custom').toString()).to.equal(searchMethod('find').toString())
  })

  it('should get the custom method', function() {
    var custom = searchMethod('custom', { 
      search: {
        command: 'grep -l ${search} .'
      }
    })

    expect(custom.toString()).to.not.equal(searchMethod('find').toString())
  })

  it('should get the native search method', function() {
    expect(searchMethod('native')).to.be.a('function')
  })
})
