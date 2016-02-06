/**
 * Created by Awesome on 1/30/2016.
 */

// import dependencies
var config       = require(global.appRoot + '/config');
var routes       = require(global.appRoot + '/cache/routes');
var path         = require('path');
var express      = require('express');
var favicon      = require('favicon');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var Mongorito    = require('mongorito');
var exphbs       = require('express-handlebars');
var hbs          = require('hbs');
var fs           = require('fs');

// create database connection
Mongorito.connect(config.database[config.environment].host + '/' + config.database[config.environment].db);

// setup express
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'cache/view'));
app.engine('hbs', exphbs({
    layoutsDir    : path.join(__dirname, 'cache/view/layout'),
    defaultLayout : 'main.layout.hbs',
    extname       : '.hbs',
    helpers       : {
        block: function (name) {
            var blocks  = this._blocks,
                content = blocks && blocks[name];

            return content ? content.join('\n') : null;
        },

        contentFor: function (name, options) {
            var blocks = this._blocks || (this._blocks = {}),
                block  = blocks[name] || (blocks[name] = []);

            block.push(options.fn(this));
        }
    }
}));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger(config.environment));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

if (config.environment == 'dev') {
    // app.use(require('connect-livereload')());
}

// set powered by
app.use(function(req, res, next){
    res.setHeader('X-Powered-By', 'EdenFrame');
    next();
});

// import routes
var register = {};
var routing  = [];
var router   = express.Router();
for (var type in routes) {
    for (var route in routes[type]) {
        if (!register[routes[type][route]['controller']]) {
            // create new controller
            var controller = require(routes[type][route]['controller']);

            register[routes[type][route]['controller']] = new controller();
        }
        router[type](route, register[routes[type][route]['controller']][routes[type][route]['action']]);
    }
}
app.use('/', router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
