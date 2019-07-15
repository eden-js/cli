
// require events
const fs     = require('fs-extra');
const tree   = require('directory-tree');
const uuid   = require('uuid');
const Events = require('events');

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
    return Promise.all(['generate'].map((namespace) => {
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
    const command = 'generate [type] [model]';
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
        .positional('model', {
          desc    : 'EdenJS Bundle Name',
          type    : 'string',
          default : 'model',
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
      return this.generateBundle(args.model, args.mount);
    }

    // if design
    if (args.type === 'design') {
      // return generate bundle
      return this.generateDesign(args.model);
    }

    // return nothing to generate
    return null;
  }

  /**
   * generates bundle
   *
   * @param  {String} model
   *
   * @return {*}
   */
  async generateDesign(model) {
    // generate design
    if (!model) model = 'design';

    // create bundle
    const generated = await this.__generate(`${global.edenRoot}/generator/design`, { model });

    // move directory
    await fs.move(`${generated}/${model}`, `${global.appRoot}/bundles/${model}`);
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
  async generateBundle(model, mount) {
    // check mount
    if (!mount) mount = `/${model.toLowerCase()}`;

    // create bundle
    const generated = await this.__generate(`${global.edenRoot}/generator/bundles`, { model, mount });

    // move directory
    await fs.move(`${generated}/${model}`, `${global.appRoot}/bundles/${model}`);
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
    if (!await fs.exists(`${global.appRoot}/.generate`)) {
      // create generate dir
      await fs.ensureDir(`${global.appRoot}/.generate`);
    }

    // generate uuid
    const id = uuid();

    // ensure new directory
    await fs.ensureDir(`${global.appRoot}/.generate/${id}`);

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
      const fileEvals = Array.from(new Set(file.match(/\$\${([^}]+)}/g)));

      // create that element
      fileEvals.forEach((val) => {
        // replace
        // eslint-disable-next-line no-eval
        file = file.split(val).join(eval(`${evalValues} (${val.slice(3, -1)})`));
      });

      // directory
      if (element.type === 'directory') {
        // create directory
        await fs.ensureDir(`${global.appRoot}/.generate/${id}${file}`);
      } else if (['.png', '.jpg', '.svg', '.ico'].includes(element.extension)) {
        // create directory
        await fs.copy(element.path, `${global.appRoot}/.generate/${id}${file}`);
      } else {
        // get contents
        let content = await fs.readFile(element.path, 'utf8');

        // create new file location
        const contentEvals = Array.from(new Set(content.match(/\$\${([^}]+)}/g)));

        // create that element
        contentEvals.forEach((val) => {
          // replace
          // eslint-disable-next-line no-eval
          content = content.split(val).join(eval(`${evalValues} (${val.slice(3, -1)})`));
        });

        // write file
        await fs.writeFile(`${global.appRoot}/.generate/${id}${file}`, content);
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
    return `${global.appRoot}/.generate/${id}`;
  }
}

// create new eden generator
const edenGenerator = new EdenGenerator();

// export module
module.exports = edenGenerator;
