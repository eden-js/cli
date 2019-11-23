// import dependencies
const fs     = require('fs-extra');
const path   = require('path');
const glob   = require('@edenjs/glob');
const Events = require('events');

/**
 * eden loader class
 */
class EdenLoader extends Events {
  /**
   * construct eden loader
   */
  constructor() {
    // run super
    super();

    // build
    this.build = this.build.bind(this);

    // build
    this.building = this.build();
  }

  /**
   * build loader
   */
  async build() {
    // create cache folder
    fs.ensureDirSync(`${global.appRoot}/.edenjs`);
    fs.ensureDirSync(`${global.appRoot}/.edenjs/.cache`);
  }

  /**
   * caches name/data to .edenjs folder
   *
   * @param name 
   * @param data 
   */
  cache(name, data) {
    // check file if no data
    if (!data) {
      // check file exists
      if (!fs.existsSync(`${global.appRoot}/.edenjs/.cache/${name}.json`)) return;

      // load file
      return JSON.parse(fs.readFileSync(`${global.appRoot}/.edenjs/.cache/${name}.json`, 'utf8'));
    }

    // write file
    fs.writeFileSync(`${global.appRoot}/.edenjs/.cache/${name}.json`, JSON.stringify(data));

    // check data
    return data;
  }

  /**
   * get import locations
   *
   * @param {Array} modules
   */
  getImports(modules = []) {
    // set file paths
    const filePaths = [];

    // Eden and app locations
    filePaths.push(global.edenRoot);
    filePaths.push(global.appRoot);

    // Core edenjs modules
    filePaths.push(`${global.edenRoot}/node_modules`);
    filePaths.push(`${global.appRoot}/node_modules`);

    // loop locations
    for (const location of glob.sync(this.getLocations(modules, 'bundles'))) {
      // set location
      let base = location.split('/bundles/');
      base = base.slice(0, -1);
      base = base.join('/bundles/');

      // locations
      if (!location.includes('bundles')) base = location;

      // check if app root
      if (base === global.appRoot) continue;

      // add file paths
      filePaths.push(...[
        ...glob.sync(path.join(base, 'bundles/*/')),
        path.join(base, 'aliases'),
        path.join(base, 'bundles'),
      ]);
    }

    // App bundles and data
    filePaths.push(`${global.appRoot}/bundles`);
    filePaths.push(`${global.appRoot}/data`);

    // Core eden files
    filePaths.push(`${global.edenRoot}/lib/aliases`);
    filePaths.push(`${global.edenRoot}/lib/core`);

    // push node_modules
    for (const localPath of modules) {
      filePaths.push(path.join(localPath, 'node_modules'));
      filePaths.push(path.resolve(localPath));
    }

    // do done
    const done = filePaths.reverse().reduce((accum, item) => {
      // includes
      if (!accum.includes(item)) accum.push(item);

      // return accumulator
      return accum;
    }, []);

    // reverse
    return done;
  }

  /**
   * gets locations
   *
   * @param {Array} modules
   */
  getLocations(modules = [], type) {
    // get append
    let append = '/bundles/*';

    // check type
    if (type === 'root') {
      append = '';
    }

    // Get config
    const locals = [].concat(...(modules.map((p) => {
      // Get paths
      const fullP = path.resolve(p);

      // Return path
      return [
        `${fullP}/node_modules/*${append}`,
        `${fullP}/node_modules/*/*${append}`,

        `${fullP}${append}`,
      ];
    })));

    // file paths
    const filePaths = [];

    // check type
    if (type === 'bundle') filePaths.push(`${global.edenRoot}/core/`);

    // check exists
    if (fs.existsSync(`${global.appRoot}/node_modules`)) {
      // push more glob paths
      filePaths.push(...[
        `${global.appRoot}/node_modules/*${append}`,
        `${global.appRoot}/node_modules/*/*${append}`,
      ]);
    }

    // push local paths afterwards
    filePaths.push(...locals);

    // check bundle exists
    if (fs.existsSync(`${global.appRoot}/bundles`)) {
      // type
      if (type !== 'none') filePaths.push(`${global.appRoot}${append}`);
    }

    // return file paths
    return filePaths;
  }

  /**
   * gets files in glob
   *
   * @param {Array} files
   * @param {Array} locations
   */
  getFiles(files, locations = null) {
    // Ensure files is an array
    const filesArr = !Array.isArray(files) ? [files] : files;

    let filtered = [];

    if (locations !== null) {
      // Combine locations with the searched files
      locations.forEach((loc) => {
        filesArr.forEach((file) => {
          filtered.push(path.join(loc, file));
        });
      });
    } else {
      filtered = files;
    }

    // Return reverse-deduplicated files
    filtered = filtered.reduceRight((accum, loc) => {
      if (!accum.includes(loc)) accum.unshift(loc);
      return accum;
    }, []);

    return filtered;
  }
}

/**
 * export eden loader class
 */
module.exports = new EdenLoader();
