
// create mixin
riot.mixin ('live', {
  /**
   * on init function
   */
  'init' : function () {
    // set live models
    this.__live = [];

    // let kill
    let killAll = () => {
      // kill all models
      this.__live.forEach ((live) => {
        // destroy
        live.destroy ();
      });
    };

    // on unmount
    this.on ('deafen',  killAll);
    this.on ('unmount', killAll);
  },

  /**
   * creates live model
   * @param  {[type]} type   [description]
   * @param  {[type]} object [description]
   * @return {[type]}        [description]
   */
  'live' : function (type, object) {
    // require live model
    const liveModel = require ('live/public/js/model');

    // create model
    let Model = new liveModel (type, object);

    // push new live model
    this.__live.push (Model);

    // on update
    Model.on ('update', this.update);

    // return model
    return Model;
  }
});
