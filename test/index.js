"use strict";
global.expect = require('chai').expect
global.bootstrap = require('./bootstrap.js')

describe('lib', function() {
  require('./lib/utils.js')
  require('./lib/users.js')
  require('./lib/tree.js')
  require('./lib/search.js')
  require('./lib/nativeSearch.js')
})

describe('api', function() {
  require('./api/login.js')
  require('./api/format.js')
  require('./api/user.js')
  require('./api/tree.js')
  require('./api/search.js')
  require('./api/admin.js')
  require('./api/upload.js')
  require('./api/archive.js')
})

describe('job', function() {
  require('./job/interactor.js')
  require('./job/memory.js')
  require('./job/stat.js')
})

describe('cache', function() {
  require('./cache/cache.js')('memory', require('../lib/cache/memory.js')(bootstrap.config))

  var redis = require('redis').createClient()
  .on('connect', function() {
    require('./cache/cache.js')('redis', require('../lib/cache/redis.js')(bootstrap.config))
  })
  //register event to avoid the Exception
  .on('error', function(err) {
  })
})
