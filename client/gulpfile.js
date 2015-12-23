'use strict'
const p = require('path')
const gulp = require('gulp')
const sass = require('gulp-sass')
const replace = require('gulp-replace')
const concat = require('gulp-concat')
const minify = require('gulp-minify-css')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify')
const haml = require('gulp-ruby-haml')
const tsc = require('gulp-typescript')
const livereload = require('gulp-livereload')

function recurseUntil(path, l) {
  let paths = [path]
  let basename = p.basename(path)

  for(let i = 0; i < l; i++) {
    paths.push(p.dirname(paths[paths.length - 1]) + '/**/' + basename)
  }

  return paths
}

const hamlPaths = recurseUntil('./src/templates/*.haml', 3)
const tscPaths = recurseUntil('./src/ts/*.ts', 2)
tscPaths.unshift('./node_modules/angular2-jwt/angular2-jwt.ts')

gulp.task('styles', function() {
  return gulp.src('./src/scss/*.scss')
  .pipe(sass({
    includePaths: ['node_modules/foundation-sites/scss']
  }))
  .pipe(concat('app.css'))
  .pipe(gulp.dest('./dist'))
  .pipe(minify())
  .pipe(rename('app.min.css'))
  .pipe(gulp.dest('./dist'))
  .pipe(livereload())
})

gulp.task('javascript:vendors', function() {
    return gulp.src([
      './node_modules/systemjs/dist/system.src.js',
      './node_modules/angular2/bundles/angular2-polyfills.js',
      './node_modules/rxjs/bundles/Rx.js',
      './node_modules/angular2/bundles/angular2.js',
      './node_modules/angular2/bundles/router.js',
      './node_modules/angular2/bundles/http.js'
    ])
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('./src/js'))
})

gulp.task('javascript:typescript', function() {
  return gulp.src(tscPaths)
  .pipe(tsc({
    module: 'system',
    typescript: require('typescript'),
    outFile: 'app.js',
    target: 'ES5',
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    noExternalResolve: true,
    moduleResolution: 'node'
   }))
  .pipe(replace('src/ts/', ''))
  .pipe(gulp.dest('./src/js'))
})

gulp.task('javascript', ['javascript:vendors', 'javascript:typescript'], function() {
  return gulp.src(['./src/js/vendor.js', './src/js/app.js'])
  .pipe(concat('app.js'))
  .pipe(gulp.dest('./dist'))
  .pipe(livereload())
  .pipe(uglify())
  .pipe(rename('app.min.js'))
  .pipe(gulp.dest('./dist'))
})

gulp.task('templates', function() {
  return gulp.src(hamlPaths)
  .pipe(haml())
  .pipe(gulp.dest('./templates'))
  .on('end', () => {
    livereload.changed('./templates')
  })
})

gulp.task('default', ['styles', 'javascript', 'templates'])

gulp.task('watch', ['default'], function() {
  livereload.listen();
  gulp.watch('./src/scss/*.scss', ['styles'])
  gulp.watch(tscPaths, ['javascript'])
  gulp.watch(hamlPaths, ['templates'])
})
