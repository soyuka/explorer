var gulp = require('gulp')
var minify = require('gulp-minify-css')
var rename = require('gulp-rename')
var uglify = require('gulp-uglify')

gulp.task('styles', function() {
  return gulp.src('./client/css/style.css')
  .pipe(minify())
  .pipe(rename('style.min.css'))
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
