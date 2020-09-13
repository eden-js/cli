/**
 * Create Models Task class
 *
 * @task models
 * @parallel
 */
export default class ModelsTask {
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
    const models = await this.cli.thread(this.thread, {
      files,

      appRoot : global.appRoot,
    });

    // add cluster to accumulator
    const data = Object.keys(models).map((name) => {
      // return file
      return `
// ${name} START

exporting['${name}'] = () => {
  // return require
  return require('${models[name]}');
};

// ${name} END
`;
    }).join('\n\n// -------------------------\n\n');

    // write file
    this.cli.write(`.index/models.js`, `const exporting = {};\n\n${data}\n\nmodule.exports = exporting;`);

    // return models
    return `${Object.keys(models).length.toLocaleString()} models indexed!`;
  }

  /**
   * Run assets task
   *
   * @param   {array} files
   */
  async thread(data) {
    // Require dependencies
    const glob = require('@edenjs/glob');
    const path = require('path');

    // Loop models
    const models = {};

    // loop models
    for (const model of await glob(data.files)) {
      // add to models
      models[path.basename(model).split('.')[0].toLowerCase()] = model;
    }
    
    // return models
    return models;
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return '/models/**/*.{js,jsx,ts,tsx}';
  }
}