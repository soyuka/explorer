let Promise = require('bluebird')

module.exports = function(name, handler) {
  describe(name, function() {
    
    let hash = '12faed'
    let time = Date.now()
    let size = 12519589

    it('should set cache', function() {
      return Promise.all([
       handler.setTime(hash, time),
       handler.setSize(hash, size)
      ])
    })

    it('should get cache time', function() {
      return handler.getTime(hash)
      .then(function(t) {
        expect(t).to.equal(time)
        return t
      })
    })

    it('should get cache size', function() {
      return handler.getSize(hash)
      .then(function(t) {
        expect(t).to.equal(size)
        return t
      })
    })

    it('should update cache', function() {
      return Promise.all([
       handler.setTime(hash, Date.now()),
       handler.setSize(hash, size + 1)
      ])
    })

    it('should get updated cache', function() {
      return Promise.all([
       handler.getTime(hash),
       handler.getSize(hash)
      ])
      .then(function(data) {
        expect(data[0]).to.be.above(time)
        expect(data[1]).to.equal(size + 1)
      })
    })
  })
}
