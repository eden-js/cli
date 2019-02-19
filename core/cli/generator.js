
// require events
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
    super(...arguments);

    // bind methods
    this.generate = this.generate.bind(this);
    this.decorate = this.decorate.bind(this);

    // specific generators
    this.generateBundle = this.generateBundle.bind(this);
  }

  /**
   * handle
   *
   * @param  {Yargs} yy
   *
   * @return {*}
   */
  decorate(yy) {
    // return handled function scope
    return yy
      .strict(false) // Additional options will be done in lib/aliases/config.js
      .positional('type', {
        desc    : 'EdenJS Generator Type',
        type    : 'string',
        default : 'bundle',
      })
      .choices('type', ['bundle']);
  }

  /**
   * generate
   *
   * @param  {*} args
   *
   * @return {*}
   */
  generate(args) {
    // check if bundle
    if (args.type === 'bundle') {
      // return generate bundle
      return this.generateBundle(args.model, args.mount);
    }

    // return nothing to generate
    return;
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


    console.log(model, mount);
  }
}

// create new eden generator
const edenGenerator = new EdenGenerator();

// export module
module.exports = [
  {
    fn          : edenGenerator.decorate,
    command     : 'generate [type]',
    handler     : edenGenerator.generate,
    description : 'Generates EdenJS logic based on type and name.',
  },
];
