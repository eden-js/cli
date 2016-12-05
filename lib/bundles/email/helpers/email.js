/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// require dependencies
var fs         = require ('fs');
var smtp       = require ('nodemailer-smtp-transport');
var helper     = require ('helper');
var nodemailer = require ('nodemailer');
var htmlToText = require ('html-to-text');

// require local dependencies
var config     = require ('app/config');
var engine     = require ('lib/utilities/engine');
var emailModel = require ('email/models/email');

/**
 * build datagrid helper class
 */
class emailHelper extends helper {
  /**
   * construct datagrid helper
   */
  constructor () {
    // run super
    super ();

    // build mailer
    this.mailer = nodemailer.createTransport (smtp (config.email));
    this.engine = new engine ();
  }

  /**
   * sends text to user
   *
   * @param  {String} template
   * @param  {Object} data
   * @param  {user}   User
   */
  async send (template, data, User) {
    // create text
    var Email = new emailModel ({
      'user'     : User,
      'data'     : data,
      'from'     : data.from || config.email.auth.user,
      'sent'     : false,
      'template' : template
    });

    // save text
    await Email.save ();

    // get email template
    template = await this.engine.email (template, data);

    // options
    var options = {
      to      : data.to, // list of receivers
      from    : data.from, // sender address
      subject : data.subject, // Subject line
      text    : data.text || htmlToText.fromString (template, {
          'wordwrap' : 130
      }), // plaintext body
      html    : template // html body
    };

    // send mail with defined transport object
    this.mailer.sendMail (options, (err, info) => {
      // check error
      if (err) {
        // log error
        this.logger.log ('error', err.toString ());

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
  }
}

/**
 * export built email helper
 *
 * @return {emailHelper}
 */
module.exports = new emailHelper ();
