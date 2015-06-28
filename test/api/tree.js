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

  after(logout)

})
