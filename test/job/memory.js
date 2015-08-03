import Memory from '../../lib/job/memory.js'

let mem;

describe('memory', function() {

  it('should create instance', function() {
      mem = new Memory('test') 
  })

  it('should store object', function() {
    mem.put('test', {foo: 'bar'})
  })
  
  it('should retreive object', function() {
    expect(mem.get('test')).to.deep.equal({foo: 'bar'})
  })

  it('should retreive full object', function() {
    expect(mem.get()).to.deep.equal({test: {foo: 'bar'}})
  })

  it('should remove object', function() {
    expect(mem.remove('test')).not.to.be.false
  })

  it('should remove non-existant object', function() {
    expect(mem.remove('test')).to.be.false
  })
  
})
