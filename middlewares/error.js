'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
function getError(config) {
  return function error(err, req, res, next) {

    if (!err) {
      err = new HTTPError('No errors - please report', 500, '/');
    }

    var d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    if (!config.quiet) if (config.dev) console.error(d, err.stack);else console.error(d, err.code + ' - ' + err.message);

    return res.format({
      'text/html': function textHtml() {
        req.flash('error', err.message);

        return res.redirect(err.redirect);
      },
      'application/json': function applicationJson() {
        return res.status(err.code).json(err).end();
      },
      'default': function _default() {
        return res.status(406).send('Not acceptable');
      }
    });
  };
}

exports.getError = getError;