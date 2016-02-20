/**
 * Created by Awesome on 1/30/2016.
 */

// import dependencies
var config       = require(global.appRoot + '/config');
var routes       = require(global.appRoot + '/cache/routes');
var menus        = require(global.appRoot + '/cache/menus.json');
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
        },

        json : function(obj) {
            return JSON.stringify(obj);
        },

        attrJson : function(obj) {
            return JSON.stringify(obj).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        },

        menu : function(name, path) {
            if (menus[name]) {
                var menu = menus[name];
                var rtn  = '<ul class="nav navbar-nav">';

                for (var key in menu) {
                    rtn += '<li class="nav-item">';

                    if (menu[key].children.length) {
                        rtn += '<a class="nav-link dropdown-toggle' + (path == menu[key].route ? ' active' : '') + '" data-toggle="dropdown" href="' + (menu[key].route ? menu[key].route : '#!') + '" role="button" aria-haspopup="true" aria-expanded="false">' + menu[key].title + '</a>';
                        rtn += '<div class="dropdown-menu">';
                        for (var sub in menu[key].children) {
                            rtn += '<a class="dropdown-item" href="' + (menu[key].children[sub].route ? menu[key].children[sub].route : '#!') + '">' + menu[key].children[sub].title + '</a>';
                        }
                        rtn += '</div>';
                    } else {
                        rtn += '<a class="nav-link' + (path == menu[key].route ? ' active' : '') + '" href="' + (menu[key].route ? menu[key].route : '#!') + '">' + menu[key].title + '</a>';
                    }

                    rtn += '</li>';
                }

                rtn += '</ul>';

                return rtn;
            }
        }
    }
}));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
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
