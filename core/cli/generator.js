
// require events
const fs      = require('fs-extra');
const tree    = require('directory-tree');
const uuid    = require('uuid');
const glob    = require('@edenjs/glob');
const Events  = require('events');
const {spawn} = require('child_process');

/**
 * create eden generator class
 *
 * @extends Events
 */
class EdenGenerator extends Events {
  /**
   * construct eden generator
   */
  constructor() {
    // run super
    // eslint-disable-next-line prefer-rest-params
    super(...arguments);

    // specific generators
    this.generateBundle = this.generateBundle.bind(this);

    // generate
    this.generate = {
      handler : this.generateHandler.bind(this),
      command : this.generateCommand.bind(this),
    };

    // generate
    this.init = {
      handler : this.initHandler.bind(this),
      command : this.initCommand.bind(this),
    };
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  //  INIT METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Init logger
   *
   * @param {Yargs} yy
   * @param {Function} logger
   */
  build(yy, logger) {
    // assign logger
    this._logger = logger;

    // add namespaced commands
    return Promise.all(['generate', 'init'].map((namespace) => {
      // return command
      return this[namespace].command(yy);
    }));
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  //  GENERATOR METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * handle
   *
   * @param  {Yargs} yy
   *
   * @return {*}
   */
  generateCommand(yy) {
    // set variables
    const command = 'generate [type] [name]';
    const description = 'Generates EdenJS logic based on type and name.';

    // create command
    yy.command(command, description, () => {
      // return handled function scope
      return yy
        .strict(false) // Additional options will be done in lib/aliases/config.js
        .positional('type', {
          desc    : 'EdenJS Generator Type',
          type    : 'string',
          default : 'bundle',
        })
        .positional('name', {
          desc    : 'EdenJS Bundle Name',
          type    : 'string',
          default : 'name',
        })
        .choices('type', ['bundle', 'design']);
    });

    // return handler
    return {
      command,
      description,

      run : this.generate.handler,
    };
  }

  /**
   * handle
   *
   * @param  {Yargs} yy
   *
   * @return {*}
   */
  initCommand(yy) {
    // set variables
    const command = 'init [name] [domain]';
    const description = 'Initializes EdenJS logic based on name and domain.';

    // create command
    yy.command(command, description, () => {
      // return handled function scope
      return yy
        .strict(false)
        .positional('name', {
          desc    : 'EdenJS Bundle Name',
          type    : 'string',
          default : 'EdenJS',
        }) // Additional options will be done in lib/aliases/config.js
        .positional('domain', {
          desc    : 'Domain, without http(s)://',
          type    : 'string',
          default : 'edenjs.com',
        });
    });

    // return handler
    return {
      command,
      description,

      run : this.init.handler,
    };
  }

  /**
   * generate
   *
   * @param  {*} args
   *
   * @return {*}
   */
  generateHandler(args) {
    // check if bundle
    if (args.type === 'bundle') {
      // return generate bundle
      return this.generateBundle(args.name);
    }

    // if design
    if (args.type === 'design') {
      // return generate bundle
      return this.generateDesign(args.name);
    }

    // if design
    if (args.type === 'base') {
      // return generate bundle
      return this.generateBase(args);
    }

    // return nothing to generate
    return null;
  }

  /**
   * generates bundle
   *
   * @param  {String} model
   * @param  {String} mount
   *
   * @return {*}
   */
  async initHandler(args) {
    // name
    const name   = args.name || 'EdenJS';
    const port   = args.port || '6969';
    const hash   = args.hash || uuid.v5();
    const domain = args.domain || 'edenjs.com';

    // generate base files
    this._logger.info('Generating base files', {
      class : 'init',
    });

    // create bundle
    const generated = await this.__generate(`${global.edenRoot}/generator/base`, {
      name,
      port,
      hash,
      domain,
    });

    // glob everything
    const files = [...(await glob(`${generated}/*`)), ...(await glob(`${generated}/.*`))];

    // map file
    await Promise.all(files.map((file) => {
      // check dirname
      return fs.move(file, `${global.appRoot}/${file.replace(generated, '')}`);
    }));

    // remove generated folder
    await fs.remove(generated);

    // generate base files
    this._logger.info('Installing dependencies', {
      class : 'init',
    });

    // init npm
    await new Promise((resolve) => {
      // exec
      const child = spawn('npm', ['i', '--save-dev']);

      // pipe error and log
      child.stderr.on('data', d => process.stderr.write(d));
      child.stdout.on('data', d => process.stdout.write(d));
      child.on('close', resolve);
    });

    // generate base files
    this._logger.info('Installed dependencies', {
      class : 'init',
    });

    // generate base files
    this._logger.info('Generating design bundle', {
      class : 'init',
    });

    // generate design
    await this.generateDesign(name);

    // generate base files
    this._logger.info('Generated design bundle', {
      class : 'init',
    });
  }

  /**
   * generates bundle
   *
   * @param  {String} model
   *
   * @return {*}
   */
  async generateDesign(name = 'design') {
    // create bundle
    const generated = await this.__generate(`${global.edenRoot}/generator/design`, { name });

    // move directory
    await fs.move(`${generated}`, `${global.appRoot}/bundles`);
    await fs.remove(generated);
  }

  /**
   * generates bundle
   *
   * @param  {String} model
   * @param  {String} mount
   *
   * @return {*}
   */
  async generateBundle(name) {
    // create bundle
    const generated = await this.__generate(`${global.edenRoot}/generator/bundle`, { name });

    // move directory
    await fs.move(`${generated}`, `${global.appRoot}/bundles`);
    await fs.remove(generated);
  }

  /**
   * generates files based on
   *
   * @param  {String}  path
   * @param  {Object}  replacements
   *
   * @return {Promise}
   */
  async __generate(path, replacements) {
    // get path tree
    const pathTree = tree(path);

    // check generate dir
    if (!await fs.exists(`${global.appRoot}/.edenjs/.generate`)) {
      // create generate dir
      await fs.ensureDir(`${global.appRoot}/.edenjs/.generate`);
    }

    // generate uuid
    const id = uuid();

    // ensure new directory
    await fs.ensureDir(`${global.appRoot}/.edenjs/.generate/${id}`);

    // create eval item
    const evalValues = Object.keys(replacements).reduce((accum, key) => {
      // eval string
      accum += `const ${key} = ${JSON.stringify(replacements[key])};`;

      // return accum
      return accum;
    }, '');

    // digest element
    const digest = async (element) => {
      // create file
      let file = element.path.replace(path, '');

      // create new file location
      const fileEvals = Array.from(new Set(file.match(/#!([^!]+)!#/g)));

      // create that element
      fileEvals.forEach((val) => {
        // replace
        // eslint-disable-next-line no-eval
        file = file.split(val).join(eval(`${evalValues} (${val.slice(2, -2)})`));
      });

      // directory
      if (element.type === 'directory') {
        // create directory
        await fs.ensureDir(`${global.appRoot}/.edenjs/.generate/${id}${file}`);
      } else if (['.png', '.jpg', '.svg', '.ico'].includes(element.extension)) {
        // create directory
        await fs.copy(element.path, `${global.appRoot}/.edenjs/.generate/${id}${file}`);
      } else {
        // get contents
        let content = await fs.readFile(element.path, 'utf8');

        // create new file location
        const contentEvals = Array.from(new Set(content.match(/#!([^!]+)!#/g)));

        // create that element
        contentEvals.forEach((val) => {
          // replace
          // eslint-disable-next-line no-eval
          content = content.split(val).join(eval(`${evalValues} (${val.slice(2, -2)})`));
        });

        // write file
        await fs.writeFile(`${global.appRoot}/.edenjs/.generate/${id}${file}`, content);
      }

      // check children
      if (element.children && element.children.length) {
        // digest all children
        await Promise.all(element.children.map(child => digest(child)));
      }
    };

    // digest tree items
    await Promise.all(pathTree.children.map(child => digest(child)));

    // return directory
    return `${global.appRoot}/.edenjs/.generate/${id}`;
  }
}

// create new eden generator
const edenGenerator = new EdenGenerator();

// export module
module.exports = edenGenerator;
