/**
 * Created by Awesome on 2/23/2016.
 */

// use strict
'use strict';

// require dependencies
var co     = require ('co');
var acl    = require ('acl');
var model  = require ('model');
var config = require ('config');
var crypto = require ('crypto');
var socket = require ('socket');

/**
 * create user model
 */
class user extends model {
    /**
     * construct example model
     *
     * @param attrs
     * @param options
     */
    constructor (attrs, options) {
        // run super
        super (attrs, options);

        // bind auth methods
        this.authenticate = this.authenticate.bind (this);

        // bind socket methods
        this.emit     = this.emit.bind (this);
        this.alert    = this.alert.bind (this);
        this.sanitise = this.sanitise.bind (this);
    }

    /**
     * check ACL before save
     */
    configure () {
        // before creation, check acl
        this.before ('create', '_acl');
    }

    /**
     * authenticates user
     *
     * @param pass
     * @returns {Promise}
     */
    authenticate (pass) {
        var that = this;

        // compare hash with password
        var hash  = that.get ('hash');
        var check = crypto
            .createHmac ('sha256', config.secret)
            .update (pass)
            .digest ('hex');

        // check if password correct
        if (check !== hash) {
            return {
                'error' : true,
                'mess'  : 'Incorrect password'
            };
        }

        // password accepted
        return {
            'error' : false
        };
    }

    /**
     * emits to socketio
     *
     * @param  {String} type
     * @param  {Object} data
     *
     * @return {*}
     */
    emit (type, data) {
        // return socket emission
        return socket.user (this, type, data);
    }

    /**
     * alerts user
     *
     * @param  {String} message
     * @param  {String} type
     * @param  {Object} options
     *
     * @return {*}
     */
    alert (message, type, options) {
        // return socket emission
        return socket.alert (this, message, type, options);
    }

    /**
     * check ACL
     *
     * @return {Promise}
     */
    async _acl () {
        // set that
        var that = this;

        // set array
        var arr  = [];

        // check default acl
        var def = await acl.where ({
            'name' : config.acl.default.name
        }).findOne ();

        // check default acl exists
        if (!def) {
            // add new acl
            def = new acl (config.acl.default);

            // save defailt
            await def.save ();
        }
        // set user acl
        arr.push (def);

        // check first
        var count = await user.count ();

        // check count
        if (!count) {
            // check first acl
            var adm = await acl.where ({
                'name' : config.acl.first.name
            }).findOne ();

            // check first acl exists
            if (!adm) {
                // add new acl
                adm = new acl (config.acl.first);

                // save admin acl
                await adm.save ();
            }

            // set user acl
            arr.push (adm);
        }

        // set acl
        that.set ('acl', arr);

        // run next
        return true;
    }

    /**
     * sanitises user
     *
     * @return {*}
     */
    sanitise () {
        return {
            'id'       : this.get ('_id').toString (),
            'balance'  : this.get ('balance') || 0,
            'username' : this.get ('username'),
            'avatar'   : this.get ('avatar')
        };
    }
}

/**
 * export user model
 * @type {user}
 */
module.exports = user;
