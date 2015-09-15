'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
function registerHooks(config, url) {
  return {
    menu: function menu() {

      if (config.upload.disabled === true) return '';

      return '<li><a href="/p/upload"><i class="icon-upload"></i>Upload</a></li>';
    }
  };
}

exports['default'] = registerHooks;
module.exports = exports['default'];