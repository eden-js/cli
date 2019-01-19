// Require dependencies
const fs             = require('fs-extra');
const os             = require('os');
const path           = require('path');
const gulp           = require('gulp');
const gulpRename     = require('gulp-rename');
const gulpSass       = require('gulp-sass');
const gulpPrefix     = require('gulp-autoprefixer');
const gulpSourcemaps = require('gulp-sourcemaps');
const through        = require('through2');

// Require local dependencies
const config = require('config');

function customImporter(url) {
  if (url[0] !== '~') {
    return null;
  }

  const edenPath = path.resolve(global.edenRoot, 'node_modules', url.substr(1));

  if (fs.existsSync(path.dirname(edenPath))) {
    return { file : edenPath };
  }

  const appPath = path.resolve(global.appRoot, 'node_modules', url.substr(1));

  if (fs.existsSync(path.dirname(appPath))) {
    return { file : appPath };
  }

  const legacyAppPath = path.resolve(global.appRoot, 'bundles', 'node_modules', url.substr(1));

  if (fs.existsSync(path.dirname(legacyAppPath))) {
    return { file : legacyAppPath };
  }

  return null;
}

/**
 * Create SASS Task class
 *
 * @task sass
 */
class SASSTask {
  /**
   * Construct SASS Task class
   *
   * @param {Loader} runner
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

    // Bind public methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);

    // Bind private methods
    this._tmp = this._tmp.bind(this);
  }

  /**
   * Run sass task
   *
   * @returns {Promise}
   */
  async run() {
    await this._tmp();

    // Run gulp task
    let job = gulp.src(`${global.appRoot}/data/cache/tmp.scss`);

    // Init gulpSourcemaps
    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.init());
    }

    job = job.pipe(gulpSass({
      importer    : customImporter,
      outputStyle : 'compressed',
    }));

    job = job.pipe(gulpPrefix({
      browsers : [
        '>0.25%',
        'not ie 11',
        'not op_mini all',
      ],
    }));

    job = job.pipe(gulpRename('app.min.css'));

    // Write gulpSourcemaps
    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.write('.'));
    }

    job = job.pipe(gulp.dest(`${global.appRoot}/data/www/public/css`));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      job.once('end', resolve);
      job.once('error', reject);
    });
  }

  /**
   * Builds temporary scss file
   *
   * @returns {Promise}
   *
   * @private
   */
  async _tmp() {
    // Set variables
    let all = '';

    // Grab gulp source for sass. Create local variables array for sass files
    const sassFiles = this._runner.files('public/scss/variables.scss');

    // Load sass
    const configSass = config.get('sass');

    // Loop config sass files
    if (configSass) {
      for (let i = 0; i < configSass.length; i += 1) {
        sassFiles.push(path.join(global.edenRoot, configSass[i]));
        sassFiles.push(path.join(global.appRoot, configSass[i]));
      }
    }

    // Push local bootstrap files
    sassFiles.push(...this._runner.files('public/scss/bootstrap.scss'));

    // Create job
    let job = gulp.src(sassFiles, { allowEmpty : true });

    // Run gulp on sass files
    job = job.pipe(through.obj(async function thru(chunk, enc, cb) {
      // Run through callback
      let type = chunk.path.split('.');

      // Update type
      type = type[type.length - 1];

      // Check type
      if (type === 'css') {
        // Prepend
        const prepend = await fs.readFile(chunk.path, 'utf8');

        // Push to this
        this.push({
          all : prepend + os.EOL,
        });
      } else {
        // Push to this
        this.push({
          all : `@import "${chunk.path}";${os.EOL}`,
        });
      }

      // Run callback
      cb(null, chunk);
    }));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      job.on('data', (data) => {
        if (data.all) {
          all += data.all;
        }
      });

      job.once('end', async () => {
        await fs.writeFile(`${global.appRoot}/data/cache/tmp.scss`, all);
        resolve();
      });

      job.once('error', reject);
    });
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return 'public/scss/**/*.scss';
  }
}

/**
 * Export SASS Task class
 *
 * @type {SASSTask}
 */
module.exports = SASSTask;
