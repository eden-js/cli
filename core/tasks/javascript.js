// Require dependencies
const fs             = require('fs-extra');
const os             = require('os');
const gulp           = require('gulp');
const path           = require('path');
const glob           = require('@edenjs/glob');
const babel          = require('@babel/core');
const browserify     = require('browserify');
const watchify       = require('watchify');
const babelify       = require('babelify');
const gulpTerser     = require('gulp-terser');
const gulpSourcemaps = require('gulp-sourcemaps');
const gulpHeader     = require('gulp-header');
const vinylSource    = require('vinyl-source-stream');
const vinylBuffer    = require('vinyl-buffer');

// Globally require babel plugins (i wish eslint would thank me too)
const babelPresets = {
  presetEnv : require('@babel/preset-env'), // eslint-disable-line global-require
};

const babelPlugins = {
  pollyfill        : require('@babel/polyfill'), // eslint-disable-line global-require
  transformClasses : require('@babel/plugin-transform-classes'), // eslint-disable-line global-require
  transformAsync   : require('@babel/plugin-transform-async-to-generator'), // eslint-disable-line global-require
  transformRuntime : require('@babel/plugin-transform-runtime'), // eslint-disable-line global-require
};

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

  async _browserify(files) {
    if (this._b !== null) {
      return this._b;
    }

    // Browserify javascript
    let b = browserify({
      paths         : global.importLocations,
      debug         : config.get('environment') === 'dev' && !config.get('noSourcemaps'),
      entries       : await glob(files),
      commondir     : false,
      insertGlobals : true,
      cache         : {},
      packageCache  : {},
    });

    b = b.transform(babelify, {
      sourceMaps : config.get('environment') === 'dev' && !config.get('noSourcemaps'),
      presets    : [
        babel.createConfigItem([babelPresets.presetEnv, {
          useBuiltIns : 'entry',
          targets     : {
            browsers : [
              '>0.25%',
              'not ie 11',
              'not op_mini all',
            ],
          },
        }]),
      ],
      plugins : [
        babel.createConfigItem(babelPlugins.pollyfill),
        babel.createConfigItem(babelPlugins.transformClasses),
        babel.createConfigItem(babelPlugins.transformAsync),
        babel.createConfigItem([babelPlugins.transformRuntime, {
          helpers      : false,
          regenerators : true,
        }]),
      ],
    });

    b.plugin(watchify, {
      poll        : false,
      ignoreWatch : ['*'],
    });

    this._b = b;

    return b;
  }

  /**
   * Run javascript task
   *
   * @return {Promise}
   */
  async run(files) {
    const b = await this._browserify(files);

    // Create job from browserify
    let job = b
      .bundle()
      .pipe(vinylSource('app.min.js')) // Convert to gulp stream
      .pipe(vinylBuffer()); // Needed for terser, sourcemaps

    // Init gulpSourcemaps
    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.init({ loadMaps : true }));
    }

    // Build vendor prepend
    let head = '';
    const js = config.get('js');

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
    if (config.get('environment') === 'live') {
      // Pipe uglify
      job = job.pipe(gulpTerser({
        ie8    : false,
        mangle : true,
        output : {
          comments : false,
        },
        compress : true,
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
      this._runner.restart();
    });

    // Wait for job to end
    await new Promise((resolve, reject) => {
      job.once('end', resolve);
      job.once('error', reject);
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
      'public/js/bootstrap.js',
    ];
  }
}

/**
 * Export Javascript Task class
 *
 * @type {JavascriptTask}
 */
module.exports = JavascriptTask;
