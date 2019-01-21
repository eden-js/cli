// Require dependencies
const fs             = require('fs-extra');
const os             = require('os');
const Path           = require('path');
const glob           = require('@edenjs/glob');
const gulp           = require('gulp');
const gulpRename     = require('gulp-rename');
const gulpSass       = require('gulp-dart-sass');
const gulpPrefix     = require('gulp-autoprefixer');
const gulpSourcemaps = require('gulp-sourcemaps');
const vinylSource    = require('vinyl-source-stream');
const vinylBuffer    = require('vinyl-buffer');

// Require local dependencies
const config = require('config');

function customImporter(url) {
  if (url[0] !== '~') {
    return null;
  }

  let location = null;

  try {
    location = require.resolve(`${url.substr(1)}.css`);
  } catch (err) { /* */ }

  try {
    location = require.resolve(`${url.substr(1)}.scss`);
  } catch (err) { /* */ }

  if (location !== null) {
    return { file : location };
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
  }

  /**
   * Run sass task
   *
   * @returns {Promise}
   */
  async run() {
    // Grab gulp source for sass. Create local variables array for sass files
    const sassFiles = this._runner.files('public/scss/variables.scss');

    // Load sass
    const configSass = config.get('sass');

    // Loop config sass files
    if (configSass) {
      for (let i = 0; i < configSass.length; i += 1) {
        sassFiles.push(Path.join(global.edenRoot, configSass[i]));
        sassFiles.push(Path.join(global.appRoot, configSass[i]));
      }
    }

    // Push local bootstrap files
    sassFiles.push(...this._runner.files('public/scss/bootstrap.scss'));

    // Create body for main file
    let body = '';

    // Add imports or embeds for all files to body
    for (const file of await glob(sassFiles)) {
      // Check type
      if (Path.extname(file) === '.css') {
        body += `${await fs.readFile(file, 'utf8')}${os.EOL}`;
      } else {
        body += `@import "${file}";${os.EOL}`;
      }
    }

    // Create job
    let job = vinylSource('master.scss');
    job.end(body);

    // Buffer for compatibility
    job = job.pipe(vinylBuffer());

    // Init gulpSourcemaps
    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.init());
    }

    job = job.pipe(gulpSass.sync({
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
