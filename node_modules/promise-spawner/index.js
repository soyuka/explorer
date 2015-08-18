var spawn = require('child_process').spawn
  , through = require('through2')
  , Promise = require('bluebird')
  , platform = require('os').platform()
  , util = require('util')
  , eol = require('os').EOL

/**
 * Spawner - a wrapper to promised spawn
 * @param  {Object}  options        modifiers {out: Function|string, err: Function|string}
 * @param  {Object}  spawn_options  options to spawn process (nodejs.org/api/child_process.html)
 * @return {Object}  Wrapper        {Promise sp = spawn, Stream out, Stream err}
 */
var Spawner = function(options, spawn_options) {

  var self = this
  var opt = {}

  if(typeof options == 'object') {
    opt.out = options.out !== undefined ? options.out : opt.out
    opt.err = options.err !== undefined ? options.err : opt.err
  }

  //those are global streams to allow piping of the current running spawn
  self.out = through.obj(function (chunk, enc, callback) {
    this.push(chunk)
    self.data.out.push(chunk)
    return callback()
  })

  self.err = through.obj(function (chunk, enc, callback) {
    this.push(chunk)
    self.data.err.push(chunk)
    return callback()
  })

  var spawn = function() {

    var args = [].slice.call(arguments)

    var last = args.length - 1

    if(!util.isArray(args[last]) && typeof args[last] == 'object') {
      var options = args.pop()
    }

    args = [].concat.apply([], args) //flatten

    var num_commands = args.length
        , commands = []
        , i = 0

    for(i; i < num_commands; i++) {
      commands.push({
        command: self.command,
        args: self.args.concat([args[i]]),
        options: options || spawn_options || {}
      })
    }

    //reset previous spawn datas
    self.data = {out: [], err: []}

    return new Promise(function(resolve, reject) {
      var j = 0

      //function to loop through promises commands
      //This handles the catch promise when a command fail
      //Then, we can reject the spawner global promise
      var loop = function(array) {
        var command = array.shift()

        self
          .promise_spawn.call(self, command, opt)
          .then(function(code) {

            if(j < num_commands - 1) {
              j++
              return loop(array)
            } else {
              resolve(code)
            }

          }).catch(function(code) {
            reject(code)
          })
      }

      loop(commands)

    }).bind(self)
  }

  //main function wrapper
  return {
    sp: spawn,
    spawn: spawn,
    out: self.out,
    err: self.err
  }
}

Spawner.prototype = {
  command: platform == 'win32' ? 'cmd.exe' : 'sh',
  args: platform == 'win32' ? ['/s', '/c'] : ['-c'],
  /**
   * Promisify Spawn
   * @param  {Object} command {command, args, spawn_options}
   * @param  {Object} options modifiers from Spawner
   * @return {Promise}         Promise resolve on error code = 0 or reject
   */
  promise_spawn: function(command, options) {
    var self = this

    return new Promise(function(resolve, reject) {

      var s = spawn(command.command, command.args, command.options)

      //spawn stdout to the Stream modifier
      //writes data back to global Stream
      s.stdout && s.stdout
        .pipe(self.pipe(options.out))
        .on('data', function(d) {
          self.out.write(d)
        })

      s.stderr && s.stderr
        .pipe(self.pipe(options.err))
        .on('data', function(d) {
          self.err.write(d)
        })

      s.on('close', function(code) {
        if(code === 0)
          resolve(code)
        else
          reject(code)
      })
    })

  },
  pipe: function(modifier) {
    modifier = modifier === undefined ? '' : modifier

    return through.obj(function (chunk, enc, callback) {
      chunk = typeof modifier == 'function' ? modifier(chunk) : modifier + chunk.toString().replace(eol, '')
      this.push(chunk)
      callback()
    })
  }
}

module.exports = Spawner
