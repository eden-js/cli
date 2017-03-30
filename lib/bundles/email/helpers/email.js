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
      'subject'  : data.subject || 'No Subject',
      'template' : template
    });

    // do hook
    await this.eden.hook ('email.compile', Email);

    // save text
    await Email.save ();

    // compile html
    let html = '';

    html += '<!DOCTYPE html>';
    html += '<html dir="ltr">';
    html += '<head>';
    html += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
    html += '<title>' + config.get ('title') + ' - ' + Email.get ('subject') + '</title>';
    html += '</head>';
    html += '<body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0">';

    // get email template
    html += await view.email (template, data);

    // end body
    html += '</body>';
    html += '</html>';

    // options
    let options = {
      'to'      : Email.get ('email'),
      'from'    : Email.get ('from'),
      'html'    : html,
      'text'    : data.text || htmlToText.fromString (html, {
        'wordwrap' : 130
      }),
      'subject' : data.subject
    };

    // loop data
    for (var key in data) {
      // check key doesnt exist
      if (!options[key]) options[key] = data[key];
    }

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
