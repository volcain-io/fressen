import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import babelify from 'babelify';
import browserSync from 'browser-sync';
import browserify from 'browserify';
import buffer from 'gulp-buffer';
import concat from 'gulp-concat';
import del from 'del';
import eslint from 'gulp-eslint';
import gulp from 'gulp';
import htmlmin from 'gulp-htmlmin';
import imagemin from 'gulp-imagemin';
import responsive from 'gulp-responsive';
import sass from 'gulp-sass';
import source from 'vinyl-source-stream';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import util from 'gulp-util';
import watchify from 'watchify';

const browser = browserSync.create();

const config = {
  paths: {
    src: './src',
    dist: './dist'
  },
  // enable 'gulp --production' command to run in production mode
  production: !!util.env.production
};

// clean dist folder
gulp.task('dist:clean', () => {
  del(`${config.paths.dist}/**/*`);
});
// clean favicon
gulp.task('favicon:clean', () => {
  del(`${config.paths.dist}/*.ico`);
});
// clean manifest
gulp.task('manifest:clean', () => {
  del(`${config.paths.dist}/manifest.json`);
});
// clean images
gulp.task('img:clean', () => {
  del(`${config.paths.dist}/img/**/*`);
});
// clean css
gulp.task('css:clean', () => {
  del(`${config.paths.dist}/css/**/*`);
});
// clean html
gulp.task('html:clean', () => {
  del(`${config.paths.dist}/*.html`);
});
// clean javascript
gulp.task('js:clean', () => {
  del([
    `${config.paths.dist}/*.js`,
    `${config.paths.dist}/*.js.map`,
    `!${config.paths.dist}/service-worker.js`,
    `!${config.paths.dist}/service-worker.js.map`
  ]);
});
// clean service-worker
gulp.task('js:sw:clean', () => {
  del([`${config.paths.dist}/service-worker.js`, `${config.paths.dist}/service-worker.js.map`]);
});

// favicon
gulp.task('favicon', ['favicon:clean'], () => {
  gulp.src(`${config.paths.src}/*.ico`).pipe(gulp.dest(config.paths.dist));
});

// manifest
gulp.task('manifest', ['manifest:clean'], () => {
  gulp.src(`${config.paths.src}/manifest.json`).pipe(gulp.dest(config.paths.dist));
});

// images
gulp.task('img:responsive', () => {
  gulp
    .src(`${config.paths.src}/img/restaurants/*.jpg`)
    .pipe(
      responsive(
        {
          '*': [
            {
              width: 400,
              height: 300
            },
            {
              width: 400 * 2,
              height: 300 * 2,
              rename: {
                suffix: '@2x'
              }
            },
            {
              width: 256,
              height: 152,
              rename: {
                suffix: '-small'
              }
            },
            {
              width: 256 * 2,
              height: 152 * 2,
              rename: {
                suffix: '-small@2x'
              }
            }
          ]
        },
        {
          quality: 70,
          crop: 'center'
        }
      )
    )
    .pipe(imagemin([imagemin.jpegtran({ progressive: true })]))
    .pipe(gulp.dest(`${config.paths.dist}/img/restaurants`));
});
gulp.task('img:svg', () => {
  gulp
    .src(`${config.paths.src}/img/**/*.svg`)
    .pipe(
      imagemin([
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }]
        })
      ])
    )
    .pipe(gulp.dest(`${config.paths.dist}/img`));
});
gulp.task('img:png', () => {
  gulp
    .src(`${config.paths.src}/img/*.png`)
    .pipe(imagemin([imagemin.optipng({ optimizationLevel: 4 })]))
    .pipe(gulp.dest(`${config.paths.dist}/img`));
});
gulp.task('img', ['img:clean', 'img:png', 'img:svg', 'img:responsive'], () => {});

// sass
gulp.task('css', ['css:clean'], () => {
  gulp
    .src(`${config.paths.src}/scss/*.scss`)
    .pipe(config.production ? util.noop() : sourcemaps.init())
    .pipe(
      sass({
        outputStyle: 'compressed'
      }).on('error', sass.logError)
    )
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions']
      })
    )
    .pipe(config.production ? util.noop() : sourcemaps.write('./'))
    .pipe(gulp.dest(`${config.paths.dist}/css`))
    .pipe(browser.stream());
});

// html
gulp.task('html', ['html:clean'], () => {
  gulp
    .src(`${config.paths.src}/*.html`)
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(config.paths.dist));
});

// js bundle
gulp.task('js:bundle', ['js:clean', 'js:lint'], () => {
  const opts = {
    entries: [`${config.paths.src}/app.js`],
    debug: false,
    plugin: [watchify]
  };
  const b = browserify(opts);

  return b
    .transform(babelify)
    .bundle()
    .on('error', util.log)
    .pipe(source('app.bundle.js'))
    .pipe(buffer())
    .pipe(config.production ? util.noop() : sourcemaps.init())
    .pipe(uglify())
    .pipe(config.production ? util.noop() : sourcemaps.write('./'))
    .pipe(gulp.dest(config.paths.dist));
});
// Service Worker
gulp.task('js:sw', ['js:sw:clean'], () => {
  gulp
    .src(`${config.paths.src}/service-worker.js`)
    .pipe(config.production ? util.noop() : sourcemaps.init())
    .pipe(babel())
    .pipe(uglify())
    .pipe(config.production ? util.noop() : sourcemaps.write('./'))
    .pipe(gulp.dest(config.paths.dist));
});
// eslint
gulp.task('js:lint', () =>
  gulp
    .src([`${config.paths.src}/**/*.js`])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError())
);

// default task
gulp.task(
  'default',
  ['favicon', 'manifest', 'img', 'css', 'html', 'js:sw', 'js:bundle'],
  // watch only in development mode (which is default mode)
  config.production
    ? () => util.noop()
    : () => {
        gulp.watch(`${config.paths.src}/scss/**/*.scss`, ['css']);
        gulp.watch(`${config.paths.src}/**/*.js`, ['js:bundle']);
        gulp.watch([`${config.paths.src}/*.html`], ['html']);
        gulp.watch(`${config.paths.src}/service-worker.js`, ['js:sw']);
        gulp
          .watch([
            `${config.paths.dist}/*.html`,
            `${config.paths.dist}/css/*.css`,
            `${config.paths.dist}/*.js`
          ])
          .on('change', browser.reload);

        browser.init({
          server: config.paths.dist
        });
      }
);
