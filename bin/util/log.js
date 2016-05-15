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
module.exports = (message, type, error) => {
    // set date and date padding
    var d = new Date();

    // set timestamp strings
    var h = d.getHours()   + '';
        h = h.length == 1 ? '0' + h : h;
    var m = d.getMinutes() + '';
        m = m.length == 1 ? '0' + m : m;
    var s = d.getSeconds() + '';
        s = s.length == 1 ? '0' + s : s;

    // set time
    var t = '[' + colors.grey(h + ':' + m + ':' + s) + ']';
    // set framework stamp
    var f = '[' + colors.cyan('EdenFrame') + ']';
    // set type stamp
    var y = (type ? (' [' + (error ? colors.red(type) : colors.green(type)) + ']') : '');

    // actually log
    console.log(t + ' ' + f + y + ' ' + message);
};
