// loader
const loader = require('lib/loader');

// Require local dependencies
const config = require('config');

/**
 * Create Javascript Task class
 *
 * @task javascript
 */
class JavascriptTask {
  /**
   * Construct Javascript Task class
   *
   * @param {Loader} runner
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

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
    // set opts
    const opts = {
      files,
      js         : loader.getFiles(config.get('js')),
      dest       : `${global.appRoot}/www/public/js`,
      cache      : `${global.appRoot}/.edenjs/.cache/browserify.json`,
      imports    : global.importLocations,
      browsers   : config.get('browserlist'),
      polyfill   : require.resolve('@babel/polyfill'),
      sourceMaps : config.get('environment') === 'dev' && !config.get('noSourcemaps'),

      appRoot  : global.appRoot,
      edenRoot : global.edenRoot,
    };

    // run in thread
    return this._runner.thread(this.thread, opts);
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
      paths         : data.imports,
      watch         : true,
      debug         : data.sourcemaps,
      entries       : [data.polyfill, ...await glob(data.files)],
      commondir     : false,
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
          targets : {
            browsers : data.browsers,
          },
          useBuiltIns : 'entry',
        }]),
      ],
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
      job = job.pipe(gulpSourcemaps.init({ loadMaps : true }));
    }

    // Build vendor prepend
    let head = '';
    const {js} = data;

    // run through files
    for (const file of (js || [])) {
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
  watch() {
    // Return files
    return [
      'public/js/**/bootstrap.{js,jsx,ts,tsx}',
    ];
  }
}

/**
 * Export Javascript Task class
 *
 * @type {JavascriptTask}
 */
module.exports = JavascriptTask;
