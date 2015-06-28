var gulp = require('gulp')
var sass = require('gulp-sass')
var concat = require('gulp-concat')
var minify = require('gulp-minify-css')
var rename = require('gulp-rename')

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

gulp.task('default', ['styles'])

gulp.task('watch', ['default'], function() {
  gulp.watch('./client/scss/*.scss', ['styles'])
})
