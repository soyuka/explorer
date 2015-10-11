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
      locals = util._extend(res.locals, locals ? locals : {})

      res.format({
        'text/html': function() {
          return app.render(name, locals, function(err, body) {
            if(err) {
              console.error(err)
              req.flash('error', err)
              //need a third arg to renderBody for callback with error 
            }

            return res.render('index.haml', util._extend(locals, {body: body}))
          }) 
        },
        'application/rss+xml': function() {
          res.set('Content-Type', 'application/rss+xml')
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

    res.handle = function(redirect, data, status) {

      redirect = redirect ? redirect : 'back'
      data = data ? data : {}
      status = status ? status : 200

      res.format({
        'text/html': function() {
          if(data.info)
            req.flash('info', data.info)
          else if(data.error)
            req.flash('error', data.error)

          return res.redirect(redirect)
        },
        'application/rss+xml': function() {
          res.set('Content-Type', 'application/rss+xml')
          return res.send('OK')
        },
        'application/json': function() {
          return res.status(status).json(util._extend(data, {redirect: redirect}))
        },
        'default': function() {
          return res.status(406).send('Not acceptable')
        }
      })
    }

    return next()
  }
}

module.exports = getFormat
