// Require dependencies
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
    this._b = null;

    // Bind public methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * browserify files
   *
   * @param  {*}  files
   *
   * @return {Promise}
   */
  async _browserify(files) {
    // check b
    if (this._b !== null) {
      return this._b;
    }

    // Browserify javascript
    let b = browserify(xtend(browserifyinc.args, {
      paths         : global.importLocations,
      watch         : true,
      debug         : config.get('environment') === 'dev' && !config.get('noSourcemaps'),
      entries       : [require.resolve('@babel/polyfill'), ...await glob(files)],
      commondir     : false,
      insertGlobals : true,
    }));

    // browserifyinc
    browserifyinc(b, {
      cacheFile : `${global.appRoot}/.edenjs/.cache/browserify.json`,
    });

    // check environment
    b = b.transform(babelify, {
      presets : [
        babel.createConfigItem([babelPresetEnv, {
          targets : {
            browsers : config.get('browserlist'),
          },
          useBuiltIns : 'entry',
        }]),
      ],
      sourceMaps : config.get('environment') === 'dev' && !config.get('noSourcemaps'),
    });

    // set b
    this._b = b;

    // return b
    return b;
  }

  /**
   * Run javascript task
   *
   * @return {Promise}
   */
  async run(files) {
    // return promise
    const b = await this._browserify(files);

    // Create browserify bundle
    const bundle = b.bundle();

    // Create job from browserify bundle
    let job = bundle
      .pipe(vinylSource('app.min.js')) // Convert to gulp stream
      .pipe(vinylBuffer()); // Needed for terser, sourcemaps

    // Init gulpSourcemaps
    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.init({ loadMaps : true }));
    }

    // Build vendor prepend
    let head = '';
    const js = loader.getFiles(config.get('js'));

    for (const file of (js || [])) {
      if (await fs.pathExists(path.join(global.edenRoot, file))) {
        head += (await fs.readFile(path.join(global.edenRoot, file), 'utf8')) + os.EOL;
      } else if (await fs.pathExists(path.join(global.appRoot, 'bundles', file))) { // Legacy format
        head += (await fs.readFile(path.join(global.appRoot, 'bundles', file), 'utf8')) + os.EOL;
      } else if (await fs.pathExists(path.join(global.appRoot, file))) {
        head += (await fs.readFile(path.join(global.appRoot, file), 'utf8')) + os.EOL;
      } else {
        throw new Error(`JS file missing: ${file}`);
      }
    }

    // Apply head to file
    job = job.pipe(gulpHeader(head, false));

    // Only minify in live
    if (config.get('environment') !== 'dev') {
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
    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.write('.'));
    }

    // Pipe job
    job = job.pipe(gulp.dest(`${global.appRoot}/data/www/public/js`));

    // Restart server on end
    job.on('end', () => {
      this._runner.emit('page', 'reload');
    });

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
