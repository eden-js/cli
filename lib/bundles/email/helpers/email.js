/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// require dependencies
const fs         = require ('fs');
const helper     = require ('helper');
const nodemailer = require ('nodemailer');
const htmlToText = require ('html-to-text');

// require models
const email = model ('email');

// require local dependencies
const view   = require ('lib/eden/view');
const config = require ('config');

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
    this.mailer = nodemailer.createTransport (config.get ('email'));
  }

  /**
   * sends text to user
   *
   * @param  {String} address
   * @param  {String} template
   * @param  {Object} data
   */
  async send (address, template, data) {
    // create text
    let Email = new email ({
      'data'     : data,
      'from'     : data.from || config.get ('email.auth.user'),
      'sent'     : false,
      'email'    : address,
      'template' : template
    });

    // do hook
    await this.eden.hook ('email.compile', Email);

    // save text
    await Email.save ();

    // get email template
    let html = await view.email (template, data);

    // options
    let options = {
      to      : Email.get ('email'),
      from    : Email.get ('from'),
      html    : html,
      text    : data.text || htmlToText.fromString (html, {
        'wordwrap' : 130
      }),
      subject : data.subject
    };

    // await for send hook
    await this.eden.hook ('email.send', {
      'email'   : Email,
      'options' : options
    });

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
