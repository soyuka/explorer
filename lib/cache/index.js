'use strict';

module.exports = function(config) {
  let allowed = ['redis', 'memory']

  if(!~allowed.indexOf(config.cache)) {
    throw new TypeError('Cache must be one of ' + allowed.join(', '))
  }

  return require('./'+config.cache+'.js')
}
