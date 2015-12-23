'use strict';
var util = require('util')
var rss = require('../routes/rss.js')
var HTTPError = require('../lib/HTTPError.js')

/**
 * Handles Accept header to render the wanted format
 * Extends res to add two methods:
 * - renderBody, render the view with the requested body
 * - handle, convenient method to redirect with information/error data
 * @param Express app
 * @return function
 */
function getFormat(app) {
  return function format(req, res, next) {
    res.renderBody = function(name, locals) {
      res.format({
        'text/html': function() {
          return app.render(name, locals, function(err, body) {
            if(err) {
              console.error(err)
              return next(err)
            }

            return res.render('index.haml', util._extend(locals, {body: body}))
          }) 
        },
        'application/rss+xml': function() {
          res.set('Content-Type', 'application/rss+xml')
          //@todo
          if(locals.tree) {
            res.locals = locals
            return rss(req, res, next)
          } else {
            return res.status(406).send('Not acceptable')
          }
        },
        'application/json': function() {
          return res.json(locals)
        },
        'default': function() {
          return res.status(406).send('Not acceptable')
        }
      })
    }

    res.handle = function(data) {
      return res.json(data) 
    }

    return next()
  }
}

module.exports = getFormat
