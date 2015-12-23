'use strict';

describe('lib', function() {
  require('./lib/utils.js')
  require('./lib/users.js')
  require('./lib/tree.js')
  require('./lib/search.js')
  require('./lib/filters.js')
})

describe('middlewares', function() {
  require('./middlewares/sanitizeCheckboxes.js')  
})

describe('job', function() {
  require('./job/notify.js')
})

describe('api', function() {
  require('./api/login.js')
  // require('./api/format.js')
  require('./api/user.js')
  // require('./api/tree.js')
  // require('./api/search.js')
  // require('./api/admin.js')
  // require('./api/upload.js')
  // require('./api/archive.js')
  // require('./api/move.js')
})

describe('cache', function() {
  require('./cache/cache.js')('memory', require('../lib/cache/memory.js'), [])

  var client = require('../lib/redis.js')(bootstrap.config)

  require('./cache/cache.js')('redis', require('../lib/cache/redis.js'), [client])
})
