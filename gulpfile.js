var gulp = require('gulp')
var sass = require('gulp-sass')
var concat = require('gulp-concat')
var minify = require('gulp-minify-css')
var rename = require('gulp-rename')
var uglify = require('gulp-uglify')

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

gulp.task('javascript', function() {
  return gulp.src('./client/js/main.js')  
  .pipe(uglify())
  .pipe(rename('main.min.js'))
  .pipe(gulp.dest('./client/js'))
})

gulp.task('default', ['styles', 'javascript'])

gulp.task('watch', ['default'], function() {
  gulp.watch('./client/scss/*.scss', ['styles'])
  gulp.watch('./client/js/main.js', ['javascript'])
})
