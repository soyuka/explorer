'use strict';
var methods = require('methods')
var http = require('http')
var https = require('https')
var SuperTest = require('supertest').Test
var agent = require('supertest').agent

module.exports = function(app, options){

  var test = agent
  if(!options)
    options = {}

  //override methods to fix some stuff and add default headers
  methods.forEach(function(method){
    test.prototype[method] = function(url, fn){
      if(options.prefix) {
        url = (typeof options.prefix == 'function' ? options.prefix(url) : options.prefix) + url
      }

      var supertest = new SuperTest(this.app, method.toUpperCase(), url);
      
      /*
       * supertest.on('response', this.saveCookies.bind(this));
       * supertest.on('redirect', this.saveCookies.bind(this));
       * supertest.on('redirect', this.attachCookies.bind(this, supertest));
       * this.attachCookies(supertest);
       */

      if(method == 'DELETE') {
        supertest.set('Content-length', 0)
      }

      if(options.headers) {
        for(let header in options.headers) {
          supertest.set(header, options.headers[header])
        }
      }

      return supertest
    };
  });


  return test(app)
};
