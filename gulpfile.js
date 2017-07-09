const gulp = require('gulp');
const prettier = require('./dist/index.js');
const tslint = require('gulp-tslint');

const isCI = process.env.CI;

gulp.task('tslint', () =>
  gulp
    .src('./src/index.ts')
    .pipe(
      prettier(
        {
          trailingComma: 'all',
          singleQuote: true,
          parser: 'typescript',
        },
        {
          filter: !isCI,
          validate: isCI,
        }
      )
    )
    .pipe(
      tslint({
        formatter: 'verbose',
      })
    )
    .pipe(tslint.report())
    .pipe(gulp.dest(file => file.base))
);

gulp.task('prettier-js', () =>
  gulp
    .src(['./src/index.test.js', './gulpfile.js'])
    .pipe(
      prettier(
        {
          trailingComma: 'es5',
          singleQuote: true,
        },
        {
          filter: !isCI,
          validate: isCI,
        }
      )
    )
    .pipe(gulp.dest(file => file.base))
);
