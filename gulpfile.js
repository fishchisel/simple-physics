'use strict'

let gulp       = require('gulp'),
    ts         = require('gulp-typescript'),
    del        = require('del'),
    Browserify = require('browserify'),
    source     = require('vinyl-source-stream'),
    tsify      = require('tsify'),
    watchify   = require('watchify'),
    express    = require('express'),
    ghPages    = require('gulp-gh-pages');

/* creates browserify instance */
let browserify =  Browserify({
    basedir: '.',
    debug: true,
    entries: ['src/ts/main.ts'],
    cache: {},
    packageCache: {}
}).plugin(tsify);

/* executes and pipes out given browserify instance */
function doBrowserify(b) {
  return b
    .bundle()
    .pipe(source('js/bundle.js'))
    .pipe(gulp.dest("dist"));
}

/* Default Task */
gulp.task('default', ['copy-html', 'express', 'watchify'], function() {

})

/* Publishes contents to ghPages */
gulp.task('publish', ['copy-html', 'browserify'], function() {
  return gulp.src('./dist/**/*').pipe(ghPages());
});

/* hosts static content with express */
gulp.task('express', function(cb) {
  let app = express();
  app.use(express.static('dist'));
  app.listen(3000, function() {
    console.log("server listening on port 3000");
    cb();
  });
});

/* Copies static HTML to output */
gulp.task('copy-html', function() {
  return gulp.src('src/index.html')
    .pipe(gulp.dest('dist'));
});

/* Compiles all typescript */
gulp.task('compile', compile);
function compile () {
  let tsProject = ts.createProject("tsconfig.json");
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest("dist/js"));
}

/* Compiles typescript and bundles for browser */
gulp.task('browserify', function() {
  return doBrowserify(browserify);
});

/* browserifys and watches for code changes */
gulp.task('watchify', function () {
  let w = watchify(browserify);
  w.on('update', () =>  doBrowserify(w));
  w.on('log', (arg) => console.log(arg));
  return doBrowserify(w);
});

/* cleans build */
gulp.task('clean', function() {
  return del([
    'dist/*'
  ]);
});
