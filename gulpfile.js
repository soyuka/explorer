var gulp = require('gulp')
var gutil = require('gulp-util')
var sass = require('gulp-sass')
var concat = require('gulp-concat')
var minify = require('gulp-minify-css')
var rename = require('gulp-rename')
var babel = require('gulp-babel')
var promise = require('bluebird').Promise
var Spawner = require('promise-spawner')
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
  .concat(['!'+prefix+'/gulpfile.js', prefix + '/*.js'])
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

gulp.task('publish:backup', ['babelize'], function() {
  return gulp.src(jsGlob('.'), {base: './'})
  .pipe(gulp.dest('./src'))
})

gulp.task('publish:babelize', ['publish:backup'], function() {
  return gulp.src(jsGlob('./dist'), {base: './dist'})
  .pipe(gulp.dest('./'))
})

gulp.task('publish:restore', function() {
  return gulp.src(jsGlob('./src'), {base: './src'})
  .pipe(gulp.dest('.'))
})

gulp.task('publish:clean', ['publish:restore'], function() {
  return del(['./dist', './src'])  
})

gulp.task('publish:npm', ['publish:babelize'], function() {
  var spawn = new Spawner({
    out: function(d) { return gutil.log(gutil.colors.green(d)) },
    err: function(d) { return gutil.log(gutil.colors.red(d)) },
  })

  return spawn.sp('npm publish', {cwd: __dirname})
  .catch(function(){
    //resolving to go to next task
    return Promise.resolve()
  })
})

gulp.task('publish', ['publish:npm'], function() {
  return gulp.start('publish:clean')
})

gulp.task('watch', ['default'], function() {
  gulp.watch('./client/scss/*.scss', ['styles'])
})
