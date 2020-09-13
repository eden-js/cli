// Require local dependencies
import fs from 'fs-extra';
import loader from '../../../lib/loader';

/**
 * Create SASS Task class
 *
 * @task scss
 * @parallel
 */
export default class ScssTask {
  /**
   * Construct SASS Task class
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
   * run in background
   *
   * @param {*} files 
   */
  async run(files) {
    // create opts
    const opts = {
      files,

      scss       : this.cli.get('config.frontend.scss.include') || [],
      bases      : this.cli.get('bases', []),
      appRoot    : global.appRoot,
      variables  : await loader.find(this.cli.get('bundles').map((b) => b.path), '/public/scss/variables.scss'),
      bootstrap  : await loader.find(this.cli.get('bundles').map((b) => b.path), '/public/scss/bootstrap.scss'),
      sourceMaps : this.cli.get('config.environment') === 'dev',
    };

    // try/catch
    try {
      // run models in background
      await this.cli.thread(this.thread, opts);
    } catch (e) {
      console.log(e);
    }

    // reload js
    if (this.cli.get('config.environment') === 'dev') {
      // emit hot
      this.cli.emit('hot', 'scss', await fs.readFile(`${global.appRoot}/www/public/css/app.min.css`, 'utf8'));
    }

    // return loaded
    return `${files.length.toLocaleString()} scss entries compiled!`;
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
    const vinylSource    = require('vinyl-source-stream');
    const vinylBuffer    = require('vinyl-buffer');
    const gulpSourcemaps = require('gulp-sourcemaps');

    // create custom importer
    const customImporter = (url) => {
      // return null for normal importer
      if (url[0] !== '~') return null;

      // file path minus tilda
      const filePath = url.substr(1).split('.')[0];

      // location null
      let location = null;

      // loop for bases
      [data.appRoot, ...data.bases].forEach((base) => {
        // find
        ['.scss', '.css'].forEach((type) => {
          // get location
          const check = `${base}/node_modules/${filePath}${type}`;

          // return location
          if (!location && fs.existsSync(check)) location = check;
        });
      });

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
    const configSass = data.scss;

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

    // pipe to rename
    job = job.pipe(gulpRename('app.min.css'));

    // Write gulpSourcemaps
    if (data.sourceMaps) {
      job = job.pipe(gulpSourcemaps.write('.'));
    }

    // create job
    job = job.pipe(gulp.dest(`${data.appRoot}/www/public/css`));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      // resolve
      job.once('end', () => {
        // resolve
        resolve();
      });
      job.once('error', (err) => {
        console.log(err);
        reject(err);
      });
    });
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return '/public/scss/**/*.scss';
  }
}
