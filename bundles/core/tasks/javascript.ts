// resolve path
import path from 'path';

/**
 * Create Javascript Task class
 *
 * @task     javascript
 * @priority 10
 * @parallel
 */
export default class JavascriptTask {
  /**
   * Construct Javascript Task class
   *
   * @param {Loader} runner
   */
  constructor(cli) {
    // Set private variables
    this.cli = cli;

    // Bind public methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run javascript task
   *
   * @return {Promise}
   */
  async run(files) {
    // create imports
    const imports = Array.from(this.cli.get('bundles', []).map((b) => b.path).reduce((accum, item) => {
      // add to set
      accum.add(item.includes('bundles/') ? `${item.split('bundles/')[0]}bundles` : item);

      // return accum
      return accum;
    }, new Set())).map((item) => path.resolve(item));

    // set opts
    const opts = {
      files,
      js      : this.cli.get('config.frontend.javascript.include'),
      dest    : `${global.appRoot}/www/public/js`,
      cache   : `${global.appRoot}/.edenjs/.cache/browserify.json`,
      imports : [...imports, ...(this.cli.get('config.import.modules', []).map((mod) => {
        return `${mod}/node_modules`;
      })), global.appRoot, `${global.appRoot}/node_modules`, `${global.edenRoot}/node_modules`],
      browsers   : this.cli.get('config.frontend.javascript.browserlist'),
      sourceMaps : this.cli.get('config.environment') === 'dev',

      appRoot  : global.appRoot,
      edenRoot : global.edenRoot,
    };

    // run in thread
    await this.cli.thread(this.thread, opts);

    // return loaded
    return `${files.length.toLocaleString()} javascript entries compiled!`;
  }

  /**
   * threadded run
   */
  async thread(data) {
    // require
    const fs             = require('fs-extra');
    const os             = require('os');
    const gulp           = require('gulp');
    const path           = require('path');
    const glob           = require('@edenjs/glob');
    const xtend          = require('xtend');
    const babel          = require('@babel/core');
    const babelify       = require('babelify');
    const browserify     = require('browserify');
    const gulpTerser     = require('gulp-terser');
    const gulpHeader     = require('gulp-header');
    const vinylSource    = require('vinyl-source-stream');
    const vinylBuffer    = require('vinyl-buffer');
    const browserifyinc  = require('browserify-incremental');
    const gulpSourcemaps = require('gulp-sourcemaps');
    const babelPresetEnv = require('@babel/preset-env');

    // Browserify javascript
    let b = browserify(xtend(browserifyinc.args, {
      paths  : data.imports,
      debug  : data.sourcemaps,
      ignore : [...((data.js || []).map((item) => {
        // check item
        if (item.indexOf('!') === 0) {
          // return item
          return item.substring(1);
        }
      }).filter(item => item))],
      entries       : [...await glob(data.files)],
      commondir     : false,
      extensions    : ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts'],
      insertGlobals : true,
    }));

    // browserifyinc
    browserifyinc(b, {
      cacheFile : data.cache,
    });

    // check environment
    b = b.transform(babelify, {
      presets : [
        babel.createConfigItem([babelPresetEnv, {
          corejs  : 3,
          targets : {
            browsers : data.browsers,
          },
          useBuiltIns : 'entry',
        }]),
      ],
      plugins : [
        ['@babel/plugin-transform-typescript', {
          strictMode : false,
        }],
      ],
      extensions : ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts'],
      sourceMaps : data.sourcemaps,
    });

    // Create browserify bundle
    const bundle = b.bundle();

    // Create job from browserify bundle
    let job = bundle
      .pipe(vinylSource('app.min.js')) // Convert to gulp stream
      .pipe(vinylBuffer()); // Needed for terser, sourcemaps

    // Init gulpSourcemaps
    if (data.sourceMaps) {
      job = job.pipe(gulpSourcemaps.init({
        loadMaps : true
      }));
    }

    // Build vendor prepend
    let head = '';

    // run through files
    for (const file of (data.js || [])) {
      if (file.indexOf('!') === 0) continue;

      if (await fs.pathExists(path.join(data.edenRoot, file))) {
        head += (await fs.readFile(path.join(data.edenRoot, file), 'utf8')) + os.EOL;
      } else if (await fs.pathExists(path.join(data.appRoot, 'bundles', file))) { // Legacy format
        head += (await fs.readFile(path.join(data.appRoot, 'bundles', file), 'utf8')) + os.EOL;
      } else if (await fs.pathExists(path.join(data.appRoot, file))) {
        head += (await fs.readFile(path.join(data.appRoot, file), 'utf8')) + os.EOL;
      } else {
        throw new Error(`JS file missing: ${file}`);
      }
    }

    // Apply head to file
    job = job.pipe(gulpHeader(head, false));

    // Only minify in live
    if (!data.sourceMaps) {
      // Pipe uglify
      job = job.pipe(gulpTerser({
        ie8      : false,
        mangle   : true,
        compress : true,
        output   : {
          comments : false,
        },
      }));
    }

    // Write gulpSourcemaps
    if (data.sourceMaps) {
      job = job.pipe(gulpSourcemaps.write('.'));
    }

    // Pipe job
    job = job.pipe(gulp.dest(data.dest));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      job.once('end', resolve);
      job.once('error', reject);
      bundle.once('error', reject);
    });
  }

  /**
   * Watch task
   *
   * @return {String[]}
   */
  watch () {
    // Return files
    return '/public/js/**/bootstrap.{js,jsx,ts,tsx}';
  }
}
