'use strict'
const p = require('path')
const gulp = require('gulp')
const sass = require('gulp-sass')
const replace = require('gulp-replace')
const concat = require('gulp-concat')
const minify = require('gulp-minify-css')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify')
const haml = require('gulp-jhaml')
const typescript = require('gulp-typescript')
const livereload = require('gulp-livereload')
const sourcemaps = require('gulp-sourcemaps')
const Builder = require('systemjs-builder')

const TYPESCRIPT_CONFIG = {
  module: 'commonjs',
  typescript: require('typescript'),
  target: 'es5',
  emitDecoratorMetadata: true,
  experimentalDecorators: true
}

const SYSTEMJS_CONFIG = {
  defaultJSExtensions: true,
  paths: {
    ['src/js/*']: 'src/js/*',
    '*': 'node_modules/*',
    'faye': 'node_modules/faye/browser/faye-browser.js'
  }
}

function recurseUntil(path, l) {
  let paths = [path]
  let basename = p.basename(path)

  for(let i = 0; i < l; i++) {
    paths.push(p.dirname(paths[paths.length - 1]) + '/**/' + basename)
  }

  return paths
}

const hamlPaths = recurseUntil('./src/templates/*.haml', 3)
const typescriptPaths = recurseUntil('./src/ts/*.ts', 2)
typescriptPaths.unshift('./node_modules/angular2-jwt/angular2-jwt.ts')
typescriptPaths.unshift('./node_modules/angular2/typings/browser.d.ts')
const jsPaths = recurseUntil('./src/js/*.js', 2)

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
      // './node_modules/rxjs/bundles/Rx.js',
      // './node_modules/angular2/bundles/angular2.js',
      // './node_modules/angular2/bundles/router.js',
      // './node_modules/angular2/bundles/http.js',
      // './node_modules/faye/browser/faye-browser.js'
    ])
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('./dist'))
})

gulp.task('javascript:typescript', function() {
  let tsResult = gulp.src(typescriptPaths)
  .pipe(sourcemaps.init())
  .pipe(typescript(TYPESCRIPT_CONFIG))

   return tsResult.js
    // .pipe(replace('src/ts/', ''))
    .pipe(sourcemaps.write('.', {sourceRoot: 'src/ts'}))
    .pipe(gulp.dest('src/js'))
})

// gulp.task('javascript:concat', ['javascript:typescript'], function() {
//   return gulp.src(jsPaths)  
//   .pipe(concat('explorer.src.js'))
//   .pipe(gulp.dest('./dist'))
// })

gulp.task('javascript:systemjs', ['javascript:typescript'], function() {
  var builder = new Builder(SYSTEMJS_CONFIG);

  return builder.buildStatic('src/js/boot.js', './dist/explorer.src.js', {
    format: 'cjs' , minify: false, mangle: false
  })
  .catch(function(err) {
    console.log('systemjs error');
    console.log(err);
  });
})

gulp.task('javascript', ['javascript:vendors', 'javascript:systemjs'], function() {
  return gulp.src(['./dist/vendor.js', './dist/explorer.src.js'])
  .pipe(concat('explorer.js'))
  .pipe(gulp.dest('./dist'))
  .pipe(livereload())
  .pipe(uglify())
  .pipe(rename('explorer.min.js'))
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
  gulp.watch(typescriptPaths, ['javascript'])
  gulp.watch(hamlPaths, ['templates'])
})
