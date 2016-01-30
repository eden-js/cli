/**
 * Created by Awesome on 1/30/2016.
 */

// import dependencies
import config       from './config';
import routes       from './cache/routes';
import express      from 'express';
import path         from 'path';
import favicon      from 'favicon';
import logger       from 'logger';
import cookieParser from 'cookie-parser';
import bodyParser   from 'body-parser';
import Mongorito    from 'mongorito';

// create database connection
Mongorito.connect(config.database[config.environment].host + '/' + config.database[config.environment].db);

// setup express
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(config.environment));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// import routes
var register = {};
var routing  = [];
for (var type in routes) {
    for (var route in routes[type]) {
        if (!register[routes[type][route]['controller']]) {
            // create new controller
            var controller = require(routes[type][route]['controller']);

            register[routes[type][route]['controller']] = new controller();
        }
        routing.push(app[type](route, register[routes[type][route]['controller']][routes[type][route]['action']]));
    }
}
app.use('/', routing);

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
