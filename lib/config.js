import p from 'path'
import util from 'util'
import mkdirp from 'mkdirp'
import fs from 'fs'

function getConfiguration(config_path) {
  let config = require('yamljs').load(config_path)

  config_path = p.dirname(config_path)

  if(!config.search) {
    config.search = {} 
  } 

  config.quiet = !!~process.argv.indexOf('-q') || !!~process.argv.indexOf('--quiet')

  config.database = p.resolve(config_path, config.database)

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

  function resolveElement(element, opts = {}) {

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

  config.remove = resolveElement(config.remove, {
    method: 'mv'
  })

  config.archive = resolveElement(config.archive)

 config.upload = resolveElement(config.upload, {
    concurrency: 10 
  })

  return config
}

export {getConfiguration}
