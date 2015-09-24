var p = require('path')
var util = require('util')
var mkdirp = require('mkdirp')
var fs = require('fs')

/**
 * ResolveElement
 * For plugins, make sure they have a path
 * If falsy, set disable: true
 * Creates directory if the element path can't be found
 * @param object element
 * @param object opts defaults
 * @return object
 */
function getResolveElement(config_path) {
  return function(element, opts) {

    if(!opts) { opts = {}}

    if(!element) {
      element = {disabled: true}
    }

    if('path' in element) {
      element.path = p.resolve(config_path, element.path || './trash')

      if(!fs.existsSync(element.path)) {
        mkdirp.sync(element.path) 
      }
    }

    element = util._extend(opts, element)

    return element
  }
}

/**
 * Load yaml configuration and normalize it
 * @param string config_path
 * @return object configuration
 */
function getConfiguration(config_path) {
  var config = require('yamljs').load(config_path)

  config.config_path = config_path = p.dirname(config_path)

  var resolveElement = getResolveElement(config_path)

  config.plugin_path = p.join(__dirname, '../plugins')

  if(!config.plugins)
    config.plugins = {}

  config.plugins = util._extend(config.plugins, {upload: {}, archive: {}, move: {}})

  if(!config.search) {
    config.search = { method: 'native' } 
  } 

  config.quiet = !!~process.argv.indexOf('-q') || !!~process.argv.indexOf('--quiet')

  config.database = p.resolve(config_path, config.database || './data/users')

  if(!config.https) {
    config.https = {}
  }
  
  config.https.key = p.resolve(config_path, config.https.key || './certs/key.pem')
  config.https.cert = p.resolve(config_path, config.https.cert || './certs/cert.pem')

  config.https = util._extend({
    port: 6859,
    enabled: true
  }, config.https)

  if(!config.port)
    config.port = 4859

  config.remove = resolveElement(config.remove, {
    method: 'mv'
  })

  config.archive = resolveElement(config.archive)

  config.upload = resolveElement(config.upload, {
    concurrency: 10,
    maxSize: '50mb',
    maxCount: 10
  })

  config.allowKeyAccess = ['/', '/download', '/search']

  config.cache = config.cache || 'memory'
  config.redis = config.redis || {host: 'redis://127.0.0.1:6379'}

  return config
}

module.exports = {getConfiguration: getConfiguration}
