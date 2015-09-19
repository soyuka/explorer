var gulp = require('gulp')
var sass = require('gulp-sass')
var concat = require('gulp-concat')
var minify = require('gulp-minify-css')
var rename = require('gulp-rename')
var babel = require('gulp-babel')
var fs = require('fs')
var shell = require('gulp-shell')
var del = require('del')

var jsDirectories = ['bin', 'lib', 'middlewares', 'plugins', 'routes']
var jsGlob = function(prefix) {
  return jsDirectories.map(function(e) { 
    return [
      [prefix, e, '**', '*.js'].join('/'), 
      [prefix, e, '*.js'].join('/')
    ]
  })
  .reduce(function(a, b) { return a.concat(b) })
  .concat(['!./gulpfile.js', './*.js'])
}

gulp.task('styles', function() {
  return gulp.src('./client/scss/*.scss')
  .pipe(sass({
    includePaths: ['bower_components/foundation/scss']
  }))
  .pipe(concat('app.css'))
  .pipe(gulp.dest('./client/css'))
  .pipe(minify())
  .pipe(rename('app.min.css'))
  .pipe(gulp.dest('./client/css'))
})

gulp.task('babelize', function() {
  return gulp.src(jsGlob('.'), {base: './'})
  .pipe(babel())
  .pipe(gulp.dest('./dist/'))
})

gulp.task('prepublish:backup', function() {
  return gulp.src(jsGlob('.'), {base: './'})
  .pipe(gulp.dest('./src'))
})

//git stash to revert
gulp.task('prepublish:babelize', ['babelize', 'prepublish:backup'], function() {
  return gulp.src(jsGlob('./dist'), {base: './dist'})
  .pipe(rename(function(path) {
    path.dirname = path.dirname.replace('..', '.')
  }))
  .pipe(gulp.dest('.'))
})

gulp.task('prepublish:clean', ['prepublish:restore'], function() {
  return del(['./dist', './src'])  
})

gulp.task('prepublish:restore', function() {
  return gulp.src(jsGlob('./src'), {base: './src'})
  .pipe(rename(function(path) {
    path.dirname = path.dirname.replace('..', '.')
  }))
  .pipe(gulp.dest('.'))
})

gulp.task('prepublish:npm', ['prepublish:babelize'], shell.task('npm publish'))

gulp.task('default', ['styles'])
gulp.task('publish', ['prepublish:npm', 'prepublish:clean'])

gulp.task('watch', ['default'], function() {
  gulp.watch('./client/scss/*.scss', ['styles'])
})
