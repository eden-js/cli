// import dependencies
import fs from 'fs-extra';
import glob from '@edenjs/glob';
import { EventEmitter } from 'events';

/**
 * eden loader class
 */
class EdenLoader extends EventEmitter {
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
  build() {
    // create cache folder
    fs.ensureDirSync(`${global.appRoot}/.edenjs`);
    fs.ensureDirSync(`${global.appRoot}/.edenjs/.cache`);
  }

  /**
   * load bundles
   */
  async bundles(specified = [], ignore = []) {
    // bases
    const bases = [
      `${global.appRoot}`,
      `${global.edenRoot}`,

      `${global.appRoot}/node_modules/*`,
      `${global.edenRoot}/node_modules/*`,

      `${global.appRoot}/node_modules/*/*`,
      `${global.edenRoot}/node_modules/*/*`,

      ...(specified),
      ...(specified.map((line) => `${line}/node_modules/*`)),
      ...(specified.map((line) => `${line}/node_modules/*/*`)),
    ];

    // map
    const done = [].concat(...(await Promise.all(bases.map(async (base) => {
      // try/catch
      try {
        return await glob(`${base}/bundles/*`);
      } catch (e) {}

      // return null
      return [];
    })))).filter((item) => fs.lstatSync(item).isDirectory()).filter((item) => {
      // check in ignore
      if (ignore.find((i) => item.includes(i))) return false;

      // return true
      return true;
    });

    // return done
    return done;
  }

  /**
   * load bundles
   */
  async find(where = [], pattern) {
    // map
    const done = [].concat(...(await Promise.all(where.map(async (base) => {
      // try/catch
      try {
        return await glob(`${base}${pattern}`);
      } catch (e) {}

      // return null
      return [];
    })))).filter((item) => fs.lstatSync(item).isFile());

    // return done
    return done;
  }
}

/**
 * export eden loader class
 */
export default new EdenLoader();
