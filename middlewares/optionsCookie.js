'use strict'
//@todo delete
/**
 * optionsCookie middlewares handles the cookies for sort, order 
 * sets req.query accordingly
 */
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

  return next()
}

module.exports = optionsCookie
