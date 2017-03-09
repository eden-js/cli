/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// require dependencies
const fs         = require ('fs');
const smtp       = require ('nodemailer-smtp-transport');
const helper     = require ('helper');
const nodemailer = require ('nodemailer');
const htmlToText = require ('html-to-text');

// require models
const email = model ('email');

// require local dependencies
const config = require ('config');
const engine = require ('lib/utilities/engine');

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
    this.mailer = nodemailer.createTransport (smtp (config.get ('email')));
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
    let Email = new email ({
      'user'     : User,
      'data'     : data,
      'from'     : data.from || config.get ('email.auth.user'),
      'sent'     : false,
      'template' : template
    });

    // save text
    await Email.save ();

    // get email template
    template = await this.engine.email (template, data);

    // options
    let options = {
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
exports = module.exports = new emailHelper ();
