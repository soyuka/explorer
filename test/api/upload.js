import p from 'path'
import fs from 'fs'
import rimraf from 'rimraf'
import async from 'async'
import interactor from '../../lib/job/interactor.js'

let upload_path = p.join(__dirname, '../fixtures/upload')
let list

function getList() {
  list = fs.readdirSync(upload_path)
    .filter(function(a) { return !/^\./.test(a)})
  return list
}

describe('upload', function() {

  before(function(cb) {
    interactor.run([p.resolve(__dirname, '../../lib/plugins/upload.js')])
    .then(function(plugins) { return cb() })
    .catch(cb)
  })

  before(bootstrap.autoAgent)
  before(bootstrap.login)

  it('should get upload', function(cb) {
    this.request.get('/upload')
    .end(cb)
  })

  it('should post file', function(cb) {
    this.request.post('/upload')
    .attach('files', p.join(__dirname, '../fixtures/tree/dir/1Mo.dat'))
    .end(function() {
      expect(getList()).to.deep.equal(['1Mo.dat'])

      return cb()
    })
  })

  it('should post same file without replacing', function(cb) {
    this.request.post('/upload')
    .attach('files', p.join(__dirname, '../fixtures/tree/dir/1Mo.dat'))
    .end(function() {

      expect(getList()).to.have.length.of(2)

      return cb()
    })
  })

  it('should post remote-upload', function(cb) {
    this.timeout(5000)
    this.request.post('/remote-upload')
    .send({links: 'https://www.google.fr/images/srpr/logo11w.png'})
    .expect(201)
    .end(function() {
      interactor.ipc.once('upload.create', function() {
        expect(getList()).to.have.length.of(3)
        return cb()
      })
    })
  })

  it('should get notifications', function(cb) {
    this.request.get('/notifications')
    .expect(function(res) {
      expect(res.body.notifications.num).to.eql(1)
      expect(res.body.notifications.upload).to.be.an('array')
      expect(res.body.notifications.upload).to.have.length.of(1)
    })
    .end(cb)
  })

  it('should delete notifications', function(cb) {
    this.request.delete('/notifications')
    .end(cb)
  })

  it('should get no notifications', function(cb) {
    this.request.get('/notifications')
    .expect(function(res) {
      expect(res.body.notifications.num).to.eql(0)
    })
    .end(cb)
  })

  after(function(cb) {
    return async.each(getList(), function(f, next) {
      return rimraf(p.join(upload_path, f), next)
    }, cb)
  })

  after(bootstrap.logout)
  after(bootstrap.removeAgent)

  after(function(cb) {
    interactor.once('exit', cb)
    interactor.kill()
  })

})
