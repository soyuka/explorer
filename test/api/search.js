'use strict';
describe('search', function() {
  
  before(bootstrap.autoAgent)
  before(bootstrap.login)

  it('should get tree', function(cb) {
    this.request.get('/search?search=*')
    .expect(function(res) {
      expect(res.body.tree).to.be.an.array
      expect(res.body.tree).to.have.length.of.at.least(1)
      expect(res.body.breadcrumb).to.be.an.array
      expect(res.body.breadcrumb).to.have.length.of(1)
    })
    .end(cb)
  })

  it('should get search', function(cb) {
    this.request.get('/search?search=dir')
    .end(cb)
  })

  it('should get search with options', function(cb) {
    this.request.get('/search?sort=time&order=desc&search=dir')
    .expect(function(res) {
      expect(res.body.breadcrumb).to.have.length.of(1)
    })
    .end(cb)
  })

  it('should get search with path', function(cb) {
    this.request.get('/search?path=dir&search=nonexistant')
    .expect(function(res) {
      expect(res.body.tree).to.have.length.of(0) 
    })
    .end(cb)
  })

  it('should get search with path and have a two-sized breadcrumb', function(cb) {
    this.request.get('/search?path=dir&search=nonexistant')
    .expect(function(res) {
      expect(res.body.breadcrumb).to.have.length.of(2)
    })
    .end(cb)
  })

  it('should get search without search', function(cb) {
    this.request.get('/search?path=dir&search=')
    .end(cb)
  })

  after(bootstrap.logout)
})
