"use strict";
var user = require('./user.js')
var trashSize = require('./trashSize.js')
var prepareTree = require('./prepareTree.js')
var sanitizeCheckboxes = require('./sanitizeCheckboxes.js')
var registerHooks = require('./registerHooks.js')
var format = require('./format.js')
var optionsCookie = require('./optionsCookie.js')
var error = require('./error.js')
var notify = require('./notify.js')

module.exports = {
  user: user,
  trashSize: trashSize,
  prepareTree: prepareTree,
  format: format,
  optionsCookie: optionsCookie,
  error: error,
  notify: notify,
  sanitizeCheckboxes: sanitizeCheckboxes,
  registerHooks: registerHooks
}
