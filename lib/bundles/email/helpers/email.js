
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
    this.mailer = nodemailer.createTransport (config.get ('email'));
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
      'from'     : data.from || config.get ('email.auth.user'),
      'sent'     : false,
      'emails'   : addresses,
      'subject'  : data.subject || 'No Subject',
      'template' : template
    });

    // do hook
    await this.eden.hook ('email.compile', Email);

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
    html += await view.email (template, data);

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

      // log successful push
      this.logger.log ('info', 'sent email message id: ' + info.messageId, {
        'class' : 'email'
      });

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
