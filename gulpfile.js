const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const plumber = require('gulp-plumber');
const browserify = require('browserify');
const livereload = require('gulp-livereload');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const gutil = require('gulp-util');
const uglify = require('gulp-uglify');

gulp.task('sass', function () {
  gulp.src('./public_src/css/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(gulp.dest('./public/css'))
    .pipe(livereload());
});

gulp.task('copy', function() {
  gulp.src('./public_src/*.*').pipe(gulp.dest('./public/'));
  gulp.src('./public_src/img/*.*').pipe(gulp.dest('./public/img/'));

})

gulp.task('js', function () {
  var b = browserify({
    entries: './public_src/js/index.js',
    debug: true,
    transform: [['babelify', {presets: ['es2015'], plugins: ['transform-inline-environment-variables']}]]
  });

  return b.bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(uglify())
    .on('error', gutil.log)
    .pipe(gulp.dest('./public/js/'));
});

gulp.task('watch', function() {
  gulp.watch('./public_src/css/**/*.scss', ['sass']);
  gulp.watch('./public_src/js/**/*.js', ['js']);
});

gulp.task('develop', function () {
  livereload.listen();
  nodemon({
    script: 'bin/www',
    ext: 'js handlebars coffee',
    stdout: false
  }).on('readable', function () {
    this.stdout.on('data', function (chunk) {
      if(/^Express server listening on port/.test(chunk)){
        livereload.changed(__dirname);
      }
    });
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  });
});

gulp.task('build', [
  'copy',
  'sass',
  'js'
])

gulp.task('default', [
  'build',
  'develop',
  'watch'
]);
