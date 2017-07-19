# gulp-prettier-plugin

[![Build Status](https://travis-ci.org/GAumala/gulp-prettier-plugin.svg?branch=master)](https://travis-ci.org/GAumala/gulp-prettier-plugin) [![Coverage Status](https://coveralls.io/repos/github/GAumala/gulp-prettier-plugin/badge.svg?branch=master)](https://coveralls.io/github/GAumala/gulp-prettier-plugin?branch=master) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

gulp plugin to format your source code files with [prettier](https://github.com/prettier/prettier).

## Install

```
yarn add --dev gulp-prettier-plugin
```

`prettier` is marked as a peer dependency, so if you already have it installed, the plugin will use that version.

## Usage

This module exports a single function with this signature:

```TypeScript
declare const prettierPlugin: (prettierOptions: any, pluginOptions: IPrettierPluginOptions) => PrettierTransform;
```

The function receives 2 optional arguments: `prettierOptions`, the options object [to configure prettier](https://github.com/prettier/prettier#options), and `pluginOptions`, options to configure the plugin. The return object is a Transform stream, just like most gulp plugins. The supported plugin options are the following:

Name | Type | Description
--- | --- | ---
`filter` | `boolean` | If `true`, the plugin will only emit files that need formatting.  This is useful when you are piping to `gulp.dest` and only want to write the files that haven't been formatted yet, otherwise every single file will be rewritten.
`validate` | `boolean` | If `true`, after all files are processed, it will throw an error if any input files were not already formatted, detailing the paths of each. You might want to turn this on only in continuous integration environments to make sure all files are formatted before any patches are merged to your repository.

All options are false by default.

## Examples

Format in-place only JS files that haven't been already formatted:

``` javascript
const gulp = require('gulp');
const prettierPlugin = require('gulp-prettier-plugin');

gulp.task('prettier', () =>
  gulp
    .src(['./src/**/*.js', './gulpfile.js'])
    .pipe(prettierPlugin(undefined, { filter: true }))
    // passing a function that returns base will write the files in-place
    .pipe(gulp.dest(file => file.base))
);
```

Format each and every JS file in place, using the [trailing-comma](https://github.com/prettier/prettier#trailing-commas) and [single-quote](https://github.com/prettier/prettier#quotes) options, and pipe any other plugin such as [eslint](eslint.org) before writing:

``` javascript
const gulp = require('gulp');
const prettierPlugin = require('gulp-prettier-plugin');
const eslint = require('gulp-eslint');

gulp.task('prettier', () =>
  gulp
    .src(['./src/**/*.js', './gulpfile.js'])
    .pipe(prettierPlugin())
    .pipe(eslint())
    .pipe(eslint.failAfterError());
    // passing a function that returns base will write the files in-place
    .pipe(gulp.dest(file => file.base))
);
```

Format typescript files (using the [parser option](https://github.com/prettier/prettier#parser)) that haven't already been formatted, skipping definitions:

``` javascript
const gulp = require('gulp');
const prettierPlugin = require('gulp-prettier-plugin');

gulp.task('prettier-ts', () =>
  gulp
    .src(['./src/**/*.ts', '!./src/**/*.d.ts'])
    .pipe(
      prettierPlugin(
        {
          parser: 'typescript',
        },
        {
          filter: true,
        }
      )
    )
    // passing a function that returns base will write the files in-place
    .pipe(gulp.dest(file => file.base))
);
```
Same as the previous example, but written in Typescript

``` typescript
import * as gulp from 'gulp'
import * as prettierPlugin from 'gulp-prettier-plugin'

gulp.task('prettier-ts', () =>
  gulp
    .src(['./src/**/*.ts', '!./src/**/*.d.ts'])
    .pipe(
      prettierPlugin(
        {
          parser: 'typescript',
        },
        {
          filter: true,
        }
      )
    )
    // passing a function that returns base will write the files in-place
    .pipe(gulp.dest(file => file.base))
);
```

Scan al JS files and when it finds a file that hasn't been formatted yet, format it in-place and save the path so that if it is running in a CI environment, it throws an error detailing the files that were not already formatted.

``` javascript
const gulp = require('gulp');
const prettierPlugin = require('gulp-prettier-plugin');
const isCI = process.env.CI;

gulp.task('prettier', () =>
  gulp
    .src(['./src/**/*.js', './gulpfile.js'])
    .pipe(
      prettierPlugin(
        {
          trailingComma: 'es5',
          singleQuote: true,
        },
        {
          filter: true,
          validate: isCI,
        }
      )
    )
    // passing a function that returns base will write the files in-place
    .pipe(gulp.dest(file => file.base))
);
```
