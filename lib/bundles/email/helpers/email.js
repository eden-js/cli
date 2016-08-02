/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// require dependencies
var co         = require ('co');
var fs         = require ('fs');
var smtp       = require ('nodemailer-smtp-transport');
var config     = require ('config');
var helper     = require ('helper');
var nodemailer = require ('nodemailer');

// require local dependencies
var engine     = require (global.appRoot + '/lib/utilities/engine');
var emailModel = require (global.appRoot + '/lib/bundles/email/models/email');

/**
 * build datagrid helper class
 */
class emailHelper extends helper {
    /**
     * construct datagrid helper
     */
    constructor (a) {
        // run super
        super (a);

        // build mailer
        this.mailer = nodemailer.createTransport(smtp (config.email));
        this.engine = new engine ();
    }

    /**
     * sends text to user
     *
     * @param  {String} template
     * @param  {Object} data
     * @param  {user}   User
     */
    send (template, data, User) {
        // set that
        var that = this;

        // run coroutine
        co (function * () {
            // create text
            var Email = new emailModel ({
                'user'     : User,
                'data'     : data,
                'from'     : data.from || config.email.auth.user,
                'sent'     : false,
                'template' : template
            });

            // save text
            yield Email.save ();

            // get email template
            template = engine.email (template, data);

            // options
            var options = {
                to      : data.to, // list of receivers
                from    : data.from, // sender address
                subject : data.subject, // Subject line
                text    : data.text || template, // plaintext body
                html    : template // html body
            };

            // send mail with defined transport object
            that.mailer.sendMail (options, (err, info) => {
                // check error
                if (err) {
                    // set error
                    Email.set ('error', err.toString ());

                    // save email
                    return Email.save ();
                }

                // set sent
                Email.set ('sent',    true);
                Email.set ('success', info.messageId);

                // save email
                Email.save ();
            });
        });
    }
}

/**
 * export built email helper
 *
 * @return {emailHelper}
 */
module.exports = new emailHelper ();
