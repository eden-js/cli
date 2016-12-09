// use strict
'use strict';

// require dependencies
var socket     = require ('socket');
var controller = require ('controller');

// require local dependencies
var user   = require ('user/models/user');
var alert  = require ('alert/models/alert');
var helper = require ('alert/helpers/alert');

/**
 * build alert controller
 */
class alertController extends controller {
  /**
   * construct example controller class
   *
   * @param {eden} eden
   */
  constructor (eden) {
    // run super eden
    super (eden);

    // build app
    this.sent       = this.sent.bind (this);
    this.connect    = this.connect.bind (this);
    this.middleware = this.middleware.bind (this);

    // run middleware
    eden.app.use (this.middleware);

    // run on sent
    eden.on ('socket:connect', this.connect);
    eden.on ('socket:user:sent', this.sent);
  }

  /**
   * do sent
   *
   * @param {Object} data
   */
  async sent (data) {
    // check if id
    if (!data.id) return;

    // get alert
    var Alert = await alert.findById (data.id);

    // check alert
    if (!Alert) return;

    // check if can save
    if (!(Alert.get ('options') || {}).save) return await Alert.remove ();

    // set done
    Alert.set ('done', true);

    // save alert
    await Alert.save ();
  }

  /**
   * on connect socket
   *
   * @param {Object} data
   */
  async connect (data) {
    // check if user
    if (!data.user) return;

    // get user
    var User = await user.findById (data.user);

    // check user
    if (!User) return;

    // check for alerts
    var Alerts = await alert.where ({
      'user.id' : User.get ('_id').toString ()
    }).find ();

    // loop alerts
    for (var i = 0; i < Alerts.length; i++) {
      // let alert
      let Alert = Alerts[i];

      // emit to redis
      socket.user (User, 'alert', await Alert.sanitise ());

      // check if can save
      if (!(Alert.get ('options') || {}).save) {
        // remove alert
        await Alert.remove ();

        // continue loop
        continue;
      }

      // set done
      Alert.set ('done', true);

      // save alert
      await Alert.save ();
    }
  }

  /**
   * build middleware
   *
   * @param  {request}  req Express request
   * @param  {response} res Express response
   * @param  {function} next Next callback
   */
  async middleware (req, res, next) {
    // set alerts
    var alerts = [];

    // check for current alerts
    if (req.user) {
      // check for alerts
      var Alerts = await alert.where ({
        'user.id' : req.user.get ('_id').toString ()
      }).find ();

      // loop alerts
      for (var i = 0; i < Alerts.length; i++) {
        // let alert
        let Alert = Alerts[i];

        // push to alerts
        alerts.push (await Alert.sanitise ());

        // check if can save
        if (!(Alert.get ('options') || {}).save) {
          // remove alert
          await Alert.remove ();

          // continue loop
          continue;
        }
      }
    }

    // set alerts
    res.locals.alerts = alerts;

    // create alert function
    req.alert = async (type, message, opts) => {
      // check if user
      if (req.user) return helper.user (req.user, type, message, opts);

      // create alert object
      var create = {
        'type'    : type,
        'message' : message
      };

      // set variables
      if (opts) create.options = opts;

      // emit to redis
      alerts.push (create);

      // set locals
      res.locals.alerts = alerts;
    };

    // run next
    next ();
  }
}

/**
 * export alert controller
 *
 * @type {alertController}
 */
module.exports = alertController;
