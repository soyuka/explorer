var expect = require('chai').expect
var assert = require('chai').assert
var Spawner = require('..')

var spawner = new Spawner()

describe('Spawner', function() {
  it('should resolve', function(cb) {
    var s = spawner.sp('echo OK')

    s
    .then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.out[0]).to.equal('OK')
      cb()
    })
    .catch(function(code) {
      assert(code, 'This should not be called')
    })
  })

  it('should reject', function(cb) {

    var s = spawner.sp('echo OK && exit 1')

    s
    .then(function(code) {
      assert(code, 'This should not be called')
    })
    .catch(function(code) {
      expect(code).to.equal(1)
      expect(this.data.out[0]).to.equal('OK')

      cb()
    })
  })

  it('should chain variadic', function(cb) {

    var s = spawner.sp('echo OK', 'echo still ok')

    s
    .then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.out).to.eql(['OK', 'still ok'])
      cb()
    })
  })

  it('should chain array', function(cb) {

    var s = spawner.sp(['echo OK', 'echo OK2'], ['echo OK3'])

    s
    .then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.out).to.eql(['OK', 'OK2', 'OK3'])
      cb()
    })
  })

  it('should chain promises', function(cb) {

    var s = spawner.sp(['echo OK', 'echo OK2'], 'echo OK3')

    s
    .then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.out).to.eql(['OK', 'OK2', 'OK3'])
      return spawner.sp('echo OK4')
    })
    .then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.out).to.eql(['OK4'])

      cb()
    })
  })

  it('should not send command after a reject', function(cb) {

    var s = spawner.sp('echo OK', 'exit 1', 'echo still ok')

    s
    .catch(function(code) {
      expect(code).to.equal(1)
      expect(this.data.out).to.eql(['OK'])
      cb()
    })
  })

  it('should have change modifier err', function(cb) {
    spawner = new Spawner({
      err: function(d) {
        return 'OMG there was an error\n'+d
      }
    })

    spawner.sp('echo string >&2').then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.err[0]).to.contain('OMG there was an error')
      cb()
    })
  })

  it('should change modified', function(cb) {
    spawner = new Spawner({out: 'this is good: ', err: 'this is bad: '})

    spawner.sp('echo string').then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.out[0]).to.equal('this is good: string')
      cb()
    })
  })

  it('should get stderr', function(cb) {
    spawner.sp('echo something >&2').then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.err[0]).to.equal('this is bad: something')
      cb()
    })
  })

  it('should write on stderr', function(cb) {
    spawner = new Spawner({out: 'out: '})

    var s = spawner.sp('sleep 0')

    spawner.err.write('test')

    s.then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.err[0]).to.equal('test')
      cb()
    })
  })

  it('should pipe on stdout', function(cb) {
    spawner = new Spawner({out: '', err: ''})

    var s = spawner.sp('echo "something"', 'echo "something else"')

    spawner.err.pipe(process.stdout)
    spawner.out.pipe(process.stdout)

    s.then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.out).to.eql(['something', 'something else'])
      cb()
    })
  })

  it('should get options as last arguments', function(cb) {
    spawner = new Spawner({out: '', err: ''})
    var s = spawner.sp('echo $TEST', {env: {TEST: 'hello'}}) 

    s.then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.out[0]).to.equal('hello')
      cb()
    })
  })

  it('should call a detached spawn with stdio: "ignore"', function(cb) {
    spawner = new Spawner({out: '', err: ''})
    var s = spawner.sp('echo "hi"', {stdio: 'ignore', detached: true}) 

    s.then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.out).to.eql([])
      cb()
    })
  })

  it('should be in a new cwd', function(cb) {
    spawner = new Spawner({out: '', err: ''})

    var previous = require('path').resolve(__dirname, '../')
    var s = spawner.sp('echo $(pwd)"/$SP"', {env: {SP: 'test'}, cwd: previous}) 

    s.then(function(code) {
      expect(code).to.equal(0)
      expect(this.data.out[0]).to.equal(__dirname)
      cb()
    })
  })
})
