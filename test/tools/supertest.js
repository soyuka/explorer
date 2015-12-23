'use strict';
var methods = require('methods')
var http = require('http')
var https = require('https')
var Test = require('supertest').Test
var agent = require('supertest').agent

module.exports = function(app, options){

  var test = agent
  if(!options)
    options = {}

  //override methods to fix some stuff and add default headers
  methods.forEach(function(method){
    test.prototype[method] = function(url, fn){
      var req = new Test(this.app, method.toUpperCase(), url);
      req.ca(this._ca);

      /*
       * req.on('response', this.saveCookies.bind(this));
       * req.on('redirect', this.saveCookies.bind(this));
       * req.on('redirect', this.attachCookies.bind(this, req));
       * this.attachCookies(req);
       */

      if(method == 'DELETE') {
        req.set('Content-length', 0)
      }

      if(options.headers) {
        for(let header in options.headers) {
          req.set(header, options.headers[header])
        }
      }

      return req;
    };
  });


  return test(app)
};
