/**
 * Created by Awesome on 3/7/2016.
 */

// use strict
'use strict';

// require dependencies
var redis      = require ('redis');
var session    = require ('express-session');
var passport   = require ('passport.socketio');
var socketio   = require ('socket.io');
var RedisStore = require ('connect-redis') (session);
var sub        = redis.createClient ();

// require local dependencies
var config = require (global.appRoot + '/config');
var log    = require (global.appRoot + '/bin/util/log');

/**
 * build socket daemon class
 */
class socketDaemon {
    /**
     * construct socket daemon class
     */
    constructor (app, server) {
        // bind variables
        this.io      = false;
        this.users   = {};
        this.sockets = {};
        this.index   = 0;

        // bind methods
        this.build  = this.build.bind (this);
        this.socket = this.socket.bind (this);

        // check if socket enabled;
        if (!config.socket) {
            return;
        }

        // build
        this.build (server);
    }

    /**
     * build chat daemon
     */
    build (server) {
        // set that
        var that = this;

        // set io
        this.io = socketio (server);

        // use passport auth
        this.io.use(passport.authorize({
            cookieParser : require('cookie-parser'),
            secret       : config.session,
            store        : RedisStore,
            key          : eden.session.id
        }));

        // set namespace ce
        var nsp = io.of ('/socket');

        // listen for connection
        io.on ('connection', that.socket);
        nsp.on ('connection', that.socket);

        // listen to redis
        sub.on ('message', (channel, data) => {
            // parse data
            data = JSON.parse (data);
            if (!data) {
                return;
            }

            // check data.to
            if (!data.to) {
                return;
            }
            // send on type
            if (!data.type) {
                data.type = 'message';
            }

            // check who to send to
            if (data.to === true) {
                // emit to socketio
                io.emit (data.type, data.data);
                // emit to namespace
                nsp.emit (data.type, data.data);
            } else if (that.users[data.to] && that.users[data.to].length) {
                // loop all user socket connections
                for (var i = 0; i < that.users[data.to].length; i++) {
                    // check socket exists
                    if (that.sockets[that.users[data.to]]) {
                        // emit to socket
                        that.sockets[that.users[data.to]].emit (data.type, data.data);
                    }
                }
            }
        });

        // subscribe to redis
        sub.subscribe (config.title + ':socket');
    }

    /**
     * set socket object
     *
     * @param socket
     */
    socket (socket) {
        // set that
        var that = this;

        // check for user
        var user = false;
        if (socket.handshake.user) {
            user = socket.handshake.user;
        }

        // set socketid
        let socketid = that.index;
        that.index++;

        // log connection
        log ('client ' + socketid + ' connected');

        // add socket to sockets object
        that.sockets[socketid] = socket;

        // check if user on handshake
        if (user) {
            // create users object
            if (!that.users[user.get('_id').toString()]) {
                that.users[user.get('_id').toString()] = [];
            }
            // add i to users object
            that.users[user.get('_id').toString()].push (socketid);
        }

        // disconnect socket
        socket.on ('disconnect', () => {
            // log disconnected
            log ('client ' + socketid + ' disconnected');

            // remove socket id from user
            if (user) {
                if (that.users[user.get('_id').toString()] && that.users[user.get('_id').toString()].indexOf (socketid) > -1) {
                    that.users[user.get('_id').toString()].splice (that.users[user.get('_id').toString()].indexOf (socketid), 1);
                }
            }

            // delete socket
            delete that.sockets[socketid];
        });
    }
}

/**
 * construct socket daemon
 *
 * @type {socketDaemon}
 */
module.exports = new socketDaemon ();
