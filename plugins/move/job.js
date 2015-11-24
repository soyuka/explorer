'use strict';
var gulp = require('gulp')
var util = require('util')
var utils = require('../../lib/utils.js')
var p = require('path')
var channel
var File = require('vinyl')
var Stream = require('stream')
var Promise = require('bluebird')
var rimraf = Promise.promisify(require('rimraf'))

function getMessage(src, dest, word) {
  if(src.length === 1)
    return `${src[0].paths ? src[0].paths.join(', ') : src.join(', ')} ${word}` + (dest ? ` to ${dest}` : '')
  else
    return `${src.length} files ${word}` + (dest ? `to ${dest}` : '')
}

function copy(src, dest) {
  return new Promise(function(resolve, reject) {
    gulp.src(src.paths, {base: src.base})
    .pipe(renameIfExists(dest))
    .pipe(gulp.dest(dest))
    .on('end', e => resolve())
    .on('error', e => reject(e))
  })
}

function move(src, dest) {
  return new Promise(function(resolve, reject) {
    return gulp.src(src.paths, {base: src.base})
    .pipe(renameIfExists(dest))
    .pipe(gulp.dest(dest))
    .on('end', function() {
      Promise.each(src.paths, function(f) {
        return rimraf(f) 
      })
      .then(resolve)
      .catch(reject)
    })
    .on('error', e => reject(e))
  })
}

function renameIfExists(dest) {
  let stream = new Stream.Transform({objectMode: true})  

  stream._transform = function(origin, encoding, cb) {
    let file = new File(origin)

    utils.exists(p.join(dest, p.relative(file.base, file.path)))
    .then(function(exists) {
      if(!exists)
        return cb(null, file)

      file.stem = file.stem + '-' + Date.now()

      return cb(null, file)
    })
  }

  return stream
}

function Move() {
  if(!(this instanceof Move))
    return new Move()
}

Move.prototype.setChannel = function(c) {
  this.channel = c
}

Move.prototype.remove = function(user, src) {
  Promise.each(src, function(f) {
    return rimraf(f) 
  })
  .then(paths => {
    this.channel.send('move:removed', user.username, src)
    this.channel.send('move:notify', user.username, {
      message: getMessage(src, null, 'removed', false)
    })
  })
  .catch((e) => this.channel.send('error', e.message))
}

Move.prototype.copy = function(user, src, dest) {
  return Promise.mapSeries(src, function(source) {
    return copy(source, dest) 
  })
  .then(() => {
    this.channel.send('move:copied', user.username, src, dest)
    this.channel.send('move:notify', user.username, {
      message: getMessage(src, dest, 'copied', true)
    })
  })
  .catch((e) => this.channel.send('error', e.message))
}

Move.prototype.move = function(user, src, dest) {
  return Promise.mapSeries(src, function(source) {
    return move(source, dest) 
  })
  .then(() => {
    this.channel.send('move:moved', user.username, src, dest)
    this.channel.send('move:notify', user.username, {
      message: getMessage(src, dest, 'moved', true)
    })
  })
  .catch((e) => this.channel.send('error', e.message))
}

module.exports = Move
