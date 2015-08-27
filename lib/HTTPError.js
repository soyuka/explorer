'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x4, _x5, _x6) { var _again = true; _function: while (_again) { var object = _x4, property = _x5, receiver = _x6; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x4 = parent; _x5 = property; _x6 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _es6Error = require('es6-error');

var _es6Error2 = _interopRequireDefault(_es6Error);

var HTTPError = (function (_ExtendableError) {
  _inherits(HTTPError, _ExtendableError);

  function HTTPError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
    var code = arguments.length <= 1 || arguments[1] === undefined ? 500 : arguments[1];
    var redirect = arguments.length <= 2 || arguments[2] === undefined ? 'back' : arguments[2];

    _classCallCheck(this, HTTPError);

    _get(Object.getPrototypeOf(HTTPError.prototype), 'constructor', this).call(this, message);

    this.code = code;
    this.redirect = redirect;
  }

  return HTTPError;
})(_es6Error2['default']);

exports['default'] = HTTPError;
module.exports = exports['default'];