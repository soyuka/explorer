'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _middlewares = require('../middlewares');

var _libHTTPErrorJs = require('../lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

var _libJobInteractorJs = require('../lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var debug = require('debug')('explorer:middlewares:registerHooks');

//Register plugins, should be called just before rendering (after prepareTree)
function registerHooks(app) {

  var plugins = app.get('plugins');
  var config = app.get('config');

  return function (req, res, next) {
    var hooks = {};
    debug(plugins);

    /**
     * @see plugins documentation
     */
    for (var _name in plugins) {
      if ('hooks' in plugins[_name]) {
        debug('Registering hooks for %s', _name);
        hooks[_name] = plugins[_name].hooks(config);
      }

      //this might be a separated router in the future on /plugin/name to avoid conflicts
      if ('router' in plugins[_name]) {
        debug('Calling router for plugin %s', _name);
        plugins[_name].router(app, {
          prepareTree: (0, _middlewares.prepareTree)(app),
          HTTPError: _libHTTPErrorJs2['default'],
          interactor: _libJobInteractorJs2['default']
        });
      }
    }

    res.locals.hooks = hooks;

    debug('Hooks', res.locals.hooks);

    return next();
  };
}

exports['default'] = registerHooks;
module.exports = exports['default'];