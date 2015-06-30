var fs = require('fs')
var minimatch = require('minimatch')

describe('tree', function(cb) {
  
  before(login)

  it('should get tree', function() {
    request.get('/')
    .end(cb)
  })

  //data is not tested here and it should be:
  //@todo find a solution to render json when format is specified
  it('should get tree with options', function() {
    request.get('/?sort=time&order=desc&search=dir')
    .end(cb)
  })

  // it('should trash a file', function(cb) {
  //   request.get('/remove?path=./tobedeleted')
  //   .expect(302)
  //   .end(function() {
  //     let l = fs.readdirSync('test/fixtures/trash/')
  //     expect(minimatch(l[0], 'tobedeleted.*')).to.be.true
  //     return cb()
  //   })
  // })
  //
  // it('should empty trash', function(cb) {
  //   // request.post('/a/trash') 
  //   // .send({})
  //   // .end(function() {
  //   //   let l = fs.readdirSync('test/fixtures/trash/')
  //   //   expect(l).to.have.length.of(0)
  //   //
  //     fs.mkdir('test/fixtures/tree/tobedeleted', cb)
  //   // })
  // })

  after(logout)
})
