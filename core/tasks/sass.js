// Require local dependencies
const config = require('config');

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
   * run in background
   *
   * @param {*} files 
   */
  async run(files) {
    // run models in background
    await this._runner.thread(this.thread, {
      files,

      sass       : config.get('sass') || [],
      paths      : global.importLocations.map((i) => `${i}/node_modules`),
      appRoot    : global.appRoot,
      variables  : this._runner.files('public/scss/variables.scss'),
      bootstrap  : this._runner.files('public/scss/bootstrap.scss'),
      sourceMaps : config.get('environment') === 'dev' && !config.get('noSourcemaps'),
    });

    // reload js
    this._runner.emit('scss', 'reload');
  }

  /**
   * Run sass task
   *
   * @returns {Promise}
   */
  async thread(data) {
    // require dependencies
    const fs             = require('fs-extra');
    const os             = require('os');
    const Path           = require('path');
    const glob           = require('@edenjs/glob');
    const gulp           = require('gulp');
    const gulpSass       = require('gulp-dart-sass');
    const gulpRename     = require('gulp-rename');
    const gulpPrefix     = require('gulp-autoprefixer');
    const vinylSource    = require('vinyl-source-stream');
    const vinylBuffer    = require('vinyl-buffer');
    const { addPath }    = require('app-module-path');
    const gulpSourcemaps = require('gulp-sourcemaps');

    // add path
    for (const path of data.paths) {
      addPath(path);
    }

    // create custom importer
    const customImporter = (url) => {
      // return null for normal importer
      if (url[0] !== '~') return null;

      // file path minus tilda
      const filePath = url.substr(1);

      // location null
      let location = null;

      // try to resolve
      try { location = require.resolve(`${filePath}.css`); } catch (err) { /* */ }
      try { location = require.resolve(`${filePath}.scss`); } catch (err) { /* */ }

      // Make `~example/files/file` also find `example/files/_file.scss`
      if (location === null) {
        try {
          const slashPos = filePath.lastIndexOf('/') + 1;
          location = require.resolve(`${filePath.substring(0, slashPos)}_${filePath.substring(slashPos, filePath.length)}.scss`);
        } catch (err) { /* */ }
      }

      // return location if not null
      if (location) {
        return { file : location };
      }

      // return null
      return null;
    };

    // Grab gulp source for sass. Create local variables array for sass files
    const sassFiles = data.variables.reverse();

    // Load sass
    const configSass = data.sass;

    // Add config sass files
    sassFiles.push(...configSass.map(p => Path.join(data.appRoot, p)));

    // Push local bootstrap files
    sassFiles.push(...data.bootstrap);

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
    if (data.sourceMaps) {
      job = job.pipe(gulpSourcemaps.init());
    }

    // pipe
    job = job.pipe(gulpSass.sync({
      importer    : customImporter,
      outputStyle : 'compressed',
    }));

    // check for production
    if (!data.sourceMaps) {
      job = job.pipe(gulpPrefix({
        browsers : config.get('browserlist'),
      }));
    }

    // pipe to rename
    job = job.pipe(gulpRename('app.min.css'));

    // Write gulpSourcemaps
    if (data.sourceMaps) {
      job = job.pipe(gulpSourcemaps.write('.'));
    }

    job = job.pipe(gulp.dest(`${data.appRoot}/data/www/public/css`));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      // resolve
      job.once('end', () => {
        // resolve
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
