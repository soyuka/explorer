describe('search', function(cb) {
  
  before(login)

  it('should get search', function() {
    request.get('/search?search=dir')
    .end(cb)
  })

  //data is not tested here and it should be:
  //@todo find a solution to render json when format is specified
  it('should get search with options', function() {
    request.get('/serach?sort=time&order=desc&search=dir')
    .end(cb)
  })

  after(logout)

})
