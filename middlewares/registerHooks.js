'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var debug = require('debug')('explorer:middlewares:registerHooks');

//Register plugins, should be called just before rendering (after prepareTree)
function registerHooks(app) {

  var plugins = app.get('plugins');
  var config = app.get('config');

  return function (req, res, next) {
    var hooks = {};

    /**
     * @see plugins documentation
     */
    for (var _name in plugins) {
      if ('hooks' in plugins[_name]) {
        debug('Registering hooks for %s', _name);
        hooks[_name] = plugins[_name].hooks(config, _path2['default'].join('/p', _name));
      }
    }

    res.locals.hooks = hooks;

    debug('Hooks', res.locals.hooks);

    return next();
  };
}

exports['default'] = registerHooks;
module.exports = exports['default'];