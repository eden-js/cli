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
  if (url[0] !== '~') return null;
  const filePath = url.substr(1);

  let location = null;

  if (location === null) try { location = require.resolve(`${filePath}.css`); } catch (err) { /* */ }

  if (location === null) try { location = require.resolve(`${filePath}.scss`); } catch (err) { /* */ }

  // Make `~example/files/file` also find `example/files/_file.scss`
  if (location === null) {
    try {
      const slashPos = filePath.lastIndexOf('/') + 1;
      location = require.resolve(`${filePath.substring(0, slashPos)}_${filePath.substring(slashPos, filePath.length)}.scss`);
    } catch (err) { /* */ }
  }

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
    const sassFiles = this._runner.files('public/scss/variables.scss').reverse();

    // Load sass
    const configSass = config.get('sass') || [];

    // Add config sass files
    sassFiles.push(...configSass.map(p => Path.join(global.appRoot, p)));

    // Push local bootstrap files
    sassFiles.push(...this._runner.files('public/scss/bootstrap.scss'));

    // Create body for main file
    let body = '';

    // global all saas files to import
    for (const file of await glob(sassFiles)) {
      // import
      body += (Path.extname(file) === '.css' ? await fs.readFile(file, 'utf8') : `@import "${file}";`) + os.EOL;
    }

    // Create job
    let job = vinylSource('master.scss');

    // Push main body file to job
    job.end(body);

    // Buffer for compatibility
    job = job.pipe(vinylBuffer());

    // Init gulpSourcemaps
    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.init());
    }

    // pipe
    job = job.pipe(gulpSass.sync({
      importer    : customImporter,
      outputStyle : 'compressed',
    }));

    // check for production
    if (config.get('environment') === 'production') {
      job = job.pipe(gulpPrefix({
        browsers : config.get('browserlist'),
      }));
    }

    // pipe to rename
    job = job.pipe(gulpRename('app.min.css'));

    // Write gulpSourcemaps
    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.write('.'));
    }

    job = job.pipe(gulp.dest(`${global.appRoot}/data/www/public/css`));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      // resolve
      job.once('end', () => {
        // resolve
        resolve();

        // reload js
        this._runner.emit('scss', 'reload');
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
