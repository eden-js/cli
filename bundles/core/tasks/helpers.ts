/**
 * Create Models Task class
 *
 * @task helpers
 * @parallel
 */
export default class HelpersTask {
  /**
   * Construct Models Task class
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
    // run models in background
    const helpers = await this.cli.thread(this.thread, {
      files,

      appRoot : global.appRoot,
    });

    // add cluster to accumulator
    const data = Object.keys(helpers).map((name) => {
      // return file
      return `
// ${name} START

exporting['${name}'] = () => {
  // return require
  return require('${helpers[name]}');
};

// ${name} END
`;
    }).join('\n\n// -------------------------\n\n');

    // write file
    this.cli.write(`.index/helpers.js`, `const exporting = {};\n\n${data}\n\nmodule.exports = exporting;`);

    // Restart server
    this.cli.emit('restart');

    // return models
    return `${Object.keys(helpers).length.toLocaleString()} helpers indexed!`;
  }

  /**
   * Run assets task
   *
   * @param   {array} files
   */
  async thread(data) {
    // Require dependencies
    const glob = require('@edenjs/glob');

    // Loop models
    const helpers = {};

    // loop models
    for (const helper of await glob(data.files)) {
      // add to models
      helpers[helper.split('/bundles/')[1].split('.')[0]] = helper;
    }
    
    // return models
    return helpers;
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return '/helpers/**/*.{js,jsx,ts,tsx}';
  }
}