import util from 'util'

function getFormat(app) {
  return function format(req, res, next) {
    res.renderBody = function(name, locals) {
      locals = util._extend(res.locals, locals ? locals : {})

      res.format({
        'text/html': function() {
          app.render(name, locals, function(err, body) {
            return res.render('index.haml', util._extend(locals, {body: body}))
          }) 
        },
        'application/rss+xml': function() {
          res.set('Content-Type', 'application/rss+xml')

          //@TODO
          if(locals.tree) {
            return res.send('OK')
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

    res.handle = function(redirect = 'back', data = {}, status = 200) {
      res.format({
        'text/html': function() {
          if(data.info)
            req.flash('info', data.info)

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

export {getFormat}
