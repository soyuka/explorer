import p from 'path'
import fs from 'fs'
import rimraf from 'rimraf'
import async from 'async'
import interactor from '../../lib/job/interactor.js'

let archive_path = p.join(__dirname, '../fixtures/tmp')
let list

function getList() {
  list = fs.readdirSync(archive_path)
    .filter(function(a) { return !/^\./.test(a)})
  return list
}

describe('archive', function() {

  before(function(cb) {
    this.timeout(5000)
    interactor.run([p.resolve(__dirname, '../../lib/plugins/archive.js')])
    .then(function(plugins) { return cb() })
    .catch(cb)
  })

  before(bootstrap.autoAgent)
  before(bootstrap.login)

  it('should post file', function(cb) {
    this.timeout(5000)
    this.request.post('/')
    .send({'path': p.join(__dirname, '../fixtures/tree/dir/1Mo.dat'), name: 'test', action: 'archive'})
    .end(function() {
      interactor.ipc.once('archive.create', function() {
        expect(getList()).to.deep.equal(['test.zip'])
        return cb()
      })
    })
  })

  it('should post and get file stream', function(cb) {
    this.timeout(5000)
    this.request.post('/')
    .send({'path': p.join(__dirname, '../fixtures/tree/dir'), name: 'test2', action: 'download'})
    .expect('Content-Type', /zip/)
    .expect('Content-disposition', /test2/)
    .expect('Transfer-Encoding', /chunked/)
    .end(cb)
  })

  after(function(cb) {
    return async.each(getList(), function(f, next) {
      return rimraf(p.join(archive_path, f), next)
    }, cb)
  })

  after(bootstrap.logout)
  after(bootstrap.removeAgent)

  after(function(cb) {
    interactor.once('exit', cb)
    interactor.kill()
  })

})
