/**
 * Created by Alex.Taylor on 2/03/2016.
 */

var colors = require ('colors');

/**
 * export log functionality
 *
 * @param message
 * @param type
 * @param error
 */
module.exports = (options) => {
    // set message string
    var message = '';

    // Return string will be passed to logger.
    var d = new Date ();

    // set timestamp strings
    var h = d.getHours()   + '';
        h = h.length == 1 ? '0' + h : h;
    var m = d.getMinutes() + '';
        m = m.length == 1 ? '0' + m : m;
    var s = d.getSeconds() + '';
        s = s.length == 1 ? '0' + s : s;

    // set time
    if (options.timestamp) message += '[' + colors.grey (h + ':' + m + ':' + s) + '] ';

    // set framework stamp
    if (options.showLevel) message += '[' + colors.cyan (options.level.toUpperCase ()) + '] ';

    // set meta tags
    if (options.meta && options.meta.class) message+= '[' + colors.green (options.meta.class) + '] ';

    // set message
    message += options.message;

    // return message
    return message;
};
