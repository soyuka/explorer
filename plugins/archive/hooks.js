"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function registerHooks(config) {
  return {
    action: function action(tree) {
      var str = "\n        <optgroup label=\"Zip\">\n          <option value=\"archive.download\" selected=\"selected\">Download</option>";

      if (config.archive.disabled != true) str += "<option value=\"archive.compress\">Archive</option>";

      str += "</optgroup>";

      return str;
    }
  };
}

exports["default"] = registerHooks;
module.exports = exports["default"];