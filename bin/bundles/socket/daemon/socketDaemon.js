/**
 * Created by Awesome on 3/7/2016.
 */

// use strict
'use strict';

// set app root
global.appRoot = '../../../..';

// require dependencies
var app       = require ('express') ();
var http      = require ('http').Server (app);
var io        = require ('socket.io') (http, {
    'path' : '/socket'
});
var redis     = require ('redis');
var sub       = redis.createClient ();
var portastic = require ('portastic');

// require local dependencies
var config = require (global.appRoot + '/config');

/**
 * build socket daemon class
 */
class socketDaemon {
    /**
     * construct socket daemon class
     */
    constructor () {
        // bind variables
        this.users   = {};
        this.sockets = {};
        this.index   = 0;

        // bind methods
        this.build  = this.build.bind (this);
        this.listen = this.listen.bind (this);
        this.socket = this.socket.bind (this);

        // build
        this.build ();
        this.listen ();
    }

    /**
     * build chat daemon
     */
    build () {
        // set that
        var that = this;

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

        // check for json
        var json = (socket.handshake.query.json ? JSON.parse(socket.handshake.query.json) : {});

        // set socketid
        let socketid = that.index;
        that.index++;

        // log connection
        process.send ('client ' + socketid + ' connected');

        // add socket to sockets object
        that.sockets[socketid] = socket;

        // check if user on handshake
        if (json.user) {
            // create users object
            if (!that.users[json.user.id]) {
                that.users[json.user.id] = [];
            }
            // add i to users object
            that.users[json.user.id].push (socketid);
        }

        // disconnect socket
        socket.on ('disconnect', () => {
            // log disconnected
            process.send ('client ' + socketid + ' disconnected');

            // remove socket id from user
            if (json.user) {
                if (that.users[json.user.id] && that.users[json.user.id].indexOf (socketid) > -1) {
                    that.users[json.user.id].splice (that.users[json.user.id].indexOf (socketid), 1);
                }
            }

            // delete socket
            delete that.sockets[socketid];
        });
    }

    /**
     * listen to http server
     */
    listen () {
        portastic.test (config.socketPort)
            .then (isOpen => {
                if (isOpen) {
                    http.listen (config.socketPort, () => {
                        process.send ('listening on port ' + config.socketPort);
                    });
                }
            });
    }
}

/**
 * construct socket daemon
 *
 * @type {socketDaemon}
 */
module.exports = new socketDaemon ();