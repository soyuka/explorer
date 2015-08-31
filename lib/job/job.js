'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _ipcee = require('ipcee');

var _ipcee2 = _interopRequireDefault(_ipcee);

var ipc = (0, _ipcee2['default'])(process);
var debug = require('debug')('explorer:job');
var p = require('path');

var plugins = {};
var args = [].slice.call(process.argv, 2);

for (var i in args) {
  var title = p.basename(args[i], '.js');
  debug('Require %s', title);
  try {
    plugins[title] = require(args[i])(ipc);
  } catch (e) {
    console.error('Could not require plugin (export a function) %s', title);
    console.error(e.stack);
  }
}

var names = Object.keys(plugins);

var transformElement = function transformElement(element) {

  if (typeof element != 'string') {
    throw new TypeError('Element should be a string (method, or plugin.method)');
  }

  element = element.split('.');

  var items = element.shift();
  var method = element.shift();

  if (!method) {
    method = items;
    items = names;
  } else {
    items = [items];
  }

  (0, _assert2['default'])(method, 'Must have one "method" argument');

  debug('Got element %o.%s', items, method);

  return { method: method, items: items };
};

var hasMethod = function hasMethod(job, method) {
  return job && method in job && typeof job[method] == 'function';
};

/**
 * Command
 * Is used for long jobs, don't expect an answer
 * Example:
 * interactor.ipc.send('call', 'job.method', args...)
 * @param string element plugin.method or method
 * @param arguments ...data
 */
ipc.on('call', function (element) {
  for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    data[_key - 1] = arguments[_key];
  }

  var _transformElement = transformElement(element);

  var method = _transformElement.method;
  var items = _transformElement.items;

  items.forEach(function (e) {
    var job = plugins[e];

    if (hasMethod(job, method)) {
      debug('Calling %s.%s', e, method);
      return job[method].apply(job, data);
    }

    return ipc.send('error', 'Method ' + method + ' is not a valid option');
  });
});

/**
 * Get
 * Like Call but we send data back
 * @see Routes.user#deleteNotifications
 * @param string element plugin.method or method
 * @param arguments data
 * @return IPCEE.send - plugin:method:get or method:get
 */
ipc.on('get', function (element) {
  for (var _len2 = arguments.length, data = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    data[_key2 - 1] = arguments[_key2];
  }

  var _transformElement2 = transformElement(element);

  var method = _transformElement2.method;
  var items = _transformElement2.items;

  var resp = {};

  items.forEach(function (e) {
    var job = plugins[e];

    if (hasMethod(job, method)) {
      debug('Get %s.%s', e, method);
      resp[e] = job[method].apply(job, data);
    }
  });

  return ipc.send(method + ':get', resp);
});

ipc.on('uncaughtException', function (err) {
  //Temptation would be to send the full Error object
  //but JSON.stringify(new Error('test')) will return '{}'
  ipc.send('error', err.toString(), err.stack);

  console.error(err.stack);

  process.nextTick(function () {
    process.exit(1);
  });
});

ipc.send('job.start', Object.keys(plugins));