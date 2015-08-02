
function optionsCookie(req, res, next) {
    
  function isString(v) {return typeof v == 'string'}

  if(isString(req.query.sort) && req.query.sort != req.cookies.sort) {
    res.cookie('sort', req.query.sort, {httpOnly: false}) 
  }

  if(isString(req.query.sort) && req.query.order != req.cookies.order) {
    res.cookie('order', req.query.order, {httpOnly: false}) 
  }

  if(isString(req.cookies.sort) && !req.query.sort) {
    req.query.sort = req.cookies.sort
  }

  if(isString(req.cookies.order) && !req.query.order) {
    req.query.order = req.cookies.order
  }

  if(!~req.url.indexOf('compress')) {
    if(req.body.compressOnFly != req.cookies.compressOnFly) {
      res.cookie('compressOnFly', req.body.compressOnFly || '0', {httpOnly: false})
    }
  
    if(isString(req.cookies.compressOnFly) && !req.body.compressOnFly) {
      req.body.compressOnFly = req.cookies.compressOnFly
    }

  }

  return next()
}

export {optionsCookie}
