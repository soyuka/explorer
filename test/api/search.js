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
    .end(cb)
  })

  after(bootstrap.logout)
  after(bootstrap.removeAgent)
})
