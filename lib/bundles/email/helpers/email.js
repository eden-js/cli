
// require dependencies
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
    this.mailer = nodemailer.createTransport (config.get ('email'), {
      'from' : config.get ('email.from') || config.get ('email.auth.user')
    });
  }

  /**
   * sends text to user
   *
   * @param  {String} addresses
   * @param  {String} template
   * @param  {Object} data
   */
  async send (addresses, template, data) {
    // make sure addresses is array
    if (!Array.isArray (addresses)) addresses = [addresses];

    // create text
    let Email = new email ({
      'data'     : data,
      'from'     : data.from || config.get ('email.from') || config.get ('email.auth.user'),
      'sent'     : false,
      'emails'   : addresses,
      'subject'  : data.subject || 'No Subject',
      'template' : template
    });

    // save text
    await Email.save ();

    // compile html
    let html = '';

    // add html content
    html += '<!DOCTYPE html>';
    html += '<html dir="ltr">';
    html += '<head>';
    html += '<meta charset="utf-8">';
    html += '<meta name="viewport" content="width=device-width">';
    html += '<meta http-equiv="X-UA-Compatible" content="IE=edge">';
    html += '<meta name="x-apple-disable-message-reformatting">';
    html += '<title>' + config.get ('title') + ' - ' + Email.get ('subject') + '</title>';
    html += '</head>';
    html += '<body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0">';

    // get email template
    html += await view.email (template, Email.get ('data'));

    // end body
    html += '</body>';
    html += '</html>';

    // options
    let options = {
      'to'   : Email.get ('emails').join (', '),
      'from' : Email.get ('from'),
      'html' : html,
      'text' : data.text || htmlToText.fromString (html, {
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

    // run try/catch
    try {
      // send mail with defined transport object
      let info = await new Promise ((resolve, reject) => {
        // send mail
        this.mailer.sendMail (options, (err, info) => {
          // check error
          if (err) return reject (err);

          // resolve
          resolve (info);
        });
      });

      // set sent
      Email.set ('sent',    true);
      Email.set ('success', info.messageId);

      // save email
      await Email.save ();
    } catch (e) {
      // log error
      this.logger.log ('error', e.toString ());

      // set error
      Email.set ('error', e.toString ());

      // save email
      await Email.save ();
    }

    // return email
    return Email;
  }
}

/**
 * export built email helper
 *
 * @return {emailHelper}
 */
exports = module.exports = new emailHelper ();
