
// Require live model
const liveModel = require('live/public/js/model');

// Create mixin
riot.mixin('live', {
  /**
   * On init function
   */
  'init' : function () {
    // Set live models
    this.__live = [];

    // Let kill
    let killAll = () => {
      // Kill all models
      this.__live.forEach((live) => {
        // Destroy
        live.destroy();
      });
    };

    // On unmount
    this.on('deafen',  killAll);
    this.on('unmount', killAll);
  },

  /**
   * Creates live model
   * @param  {[type]} type   [description]
   * @param  {[type]} object [description]
   * @return {[type]}        [description]
   */
  'live' : function (type, object) {
    // Create model
    let Model = new liveModel(type, object);

    // Push new live model
    this.__live.push(Model);

    // On update
    Model.on('update', this.update);

    // Return model
    return Model;
  }
});
