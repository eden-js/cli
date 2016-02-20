/**
 * Created by Awesome on 1/30/2016.
 */

// require local dependencies
var config       = require(global.appRoot + '/config');
var routes       = require(global.appRoot + '/cache/routes');
var view         = require(global.appRoot + '/bin/view');

// require node dependencies
var path         = require('path');
var express      = require('express');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var Mongorito    = require('mongorito');

// create mongorito connection
Mongorito.connect(config.database[config.environment].host + '/' + config.database[config.environment].db);

// bootstrap express
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'cache/view'));
app.engine('hbs', view);
app.set('view engine', 'hbs');

// use app requirements
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// set powered by to EdenFrame
app.use(function(req, res, next){
    res.setHeader('X-Powered-By', 'EdenFrame');
    next();
});

// create routing
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

// 404 error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// 500 error handler
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

/**
 * export express app
 */
module.exports = app;
