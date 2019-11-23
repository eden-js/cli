
// bind dependencies
import config     from 'config';
import Controller from 'controller';

/**
 * build #!name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()!# controller
 *
 * @mount  /
 */
export default class #!name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()!#Controller extends Controller {
  /**
   * construct Design controller
   */
  constructor() {
    // run super
    super();

    // bind build methods
    this.build = this.build.bind(this);

    // build $${model.toLowerCase()} controller
    this.building = this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * build $${model.toLowerCase()} controller
   *
   * @return {Promise}
   */
  async build() {

    // use router
    this.eden.router.use(async (req, res, next) => {
      // set header
      let fa  = '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, minimum-scale=1, user-scalable=no">';
      fa += '<link rel="manifest" href="/manifest.json">';
      fa += `<link rel="icon" type="image/x-icon" href="${config.get('cdn.url') || '/'}public/assets/icons/favicon.ico">`;
      fa += '<meta http-equiv="X-UA-Compatible" content="IE=edge">';
      fa += '<meta name="apple-mobile-web-app-capable" content="yes">';

      // set icons
      fa += '<link rel="manifest" href="/manifest.json">';
      fa += '<meta name="theme-color" content="#ffffff">';
      fa += '<meta name="msapplication-TileColor" content="#ffffff">';
      fa += `<link rel="icon" type="image/png" sizes="16x16" href="${config.get('cdn.url') || '/'}public/assets/icons/favicon-16x16.png">`;
      fa += `<link rel="icon" type="image/png" sizes="32x32" href="${config.get('cdn.url') || '/'}public/assets/icons/favicon-32x32.png">`;
      fa += `<link rel="icon" type="image/png" sizes="96x96" href="${config.get('cdn.url') || '/'}public/assets/icons/favicon-96x96.png>`;
      fa += `<link rel="icon" type="image/png" sizes="192x192" href="${config.get('cdn.url') || '/'}public/assets/icons/android-icon-192x192.png">`;
      fa += `<meta name="msapplication-TileImage" content="${config.get('cdn.url') || '/'}public/assets/icons/ms-icon-144x144.png">`;
      fa += `<link rel="apple-touch-icon" sizes="57x57" href="${config.get('cdn.url') || '/'}public/assets/icons/apple-icon-57x57.png">`;
      fa += `<link rel="apple-touch-icon" sizes="72x72" href="${config.get('cdn.url') || '/'}public/assets/icons/apple-icon-72x72.png">`;
      fa += `<link rel="apple-touch-icon" sizes="76x76" href="${config.get('cdn.url') || '/'}public/assets/icons/apple-icon-76x76.png">`;
      fa += `<link rel="apple-touch-icon" sizes="114x114" href="${config.get('cdn.url') || '/'}public/assets/icons/apple-icon-114x114.png">`;
      fa += `<link rel="apple-touch-icon" sizes="120x120" href="${config.get('cdn.url') || '/'}public/assets/icons/apple-icon-120x120.png">`;
      fa += `<link rel="apple-touch-icon" sizes="144x144" href="${config.get('cdn.url') || '/'}public/assets/icons/apple-icon-144x144.png">`;
      fa += `<link rel="apple-touch-icon" sizes="152x152" href="${config.get('cdn.url') || '/'}public/assets/icons/apple-icon-152x152.png">`;
      fa += `<link rel="apple-touch-icon" sizes="180x180" href="${config.get('cdn.url') || '/'}public/assets/icons/apple-icon-180x180.png">`;

      // set footer
      let ft = '';

      // set head
      res.locals.page.head = (res.locals.head || '') + fa;
      res.locals.page.script = (res.locals.page.script || '') + ft;

      // add footer placements
      req.placement('footer');

      // run next
      next();
    });
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // ROUTE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Index action
   *
   * @param    {Request}  req
   * @param    {Response} res
   *
   * @name     HOME
   * @route    {get} /
   * @menu     {MAIN} Home
   * @priority 10
   */
  async indexAction(req, res) {
    // do home placement
    req.placement('home');

    // render Page
    res.render('home');
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // INFORMATION METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Manifest action
   *
   * @param    {Request}  req
   * @param    {Response} res
   *
   * @route {get} /manifest.json
   */
  async manifestAction(req, res) {
    // return JSON
    res.json({
      name  : '#!name!#',
      icons : [
        {
          src     : `${config.get('cdn.url') || '/'}public/assets/icons/android-icon-36x36.png`,
          type    : 'image/png',
          sizes   : '36x36',
          density : '0.75',
        },
        {
          src     : `${config.get('cdn.url') || '/'}public/assets/icons/android-icon-48x48.png`,
          type    : 'image/png',
          sizes   : '48x48',
          density : '1.0',
        },
        {
          src     : `${config.get('cdn.url') || '/'}public/assets/icons/android-icon-72x72.png`,
          type    : 'image/png',
          sizes   : '72x72',
          density : '1.5',
        },
        {
          src     : `${config.get('cdn.url') || '/'}public/assets/icons/android-icon-96x96.png`,
          type    : 'image/png',
          sizes   : '96x96',
          density : '2.0',
        },
        {
          src     : `${config.get('cdn.url') || '/'}public/assets/icons/android-icon-144x144.png`,
          type    : 'image/png',
          sizes   : '144x144',
          density : '3.0',
        },
        {
          src     : `${config.get('cdn.url') || '/'}public/assets/icons/android-icon-192x192.png`,
          type    : 'image/png',
          sizes   : '192x192',
          density : '4.0',
        },
      ],
    });
  }

  /**
   * Config action
   *
   * @param    {Request}  req
   * @param    {Response} res
   *
   * @route {get} /browserconfig.xml
   */
  async browserConfigAction(req, res) {
    // send xml response
    res.send(`
      <?xml version="1.0" encoding="utf-8"?>
      <browserconfig>
        <msapplication>
          <tile>
            <square70x70logo src="${config.get('cdn.url') || '/'}public/assets/icons/ms-icon-70x70.png" />
            <square150x150logo src="${config.get('cdn.url') || '/'}public/assets/icons/ms-icon-150x150.png" />
            <square310x310logo src="${config.get('cdn.url') || '/'}public/assets/icons/ms-icon-310x310.png" />
            <TileColor>#ffffff</TileColor>
          </tile>
        </msapplication>
      </browserconfig>
    `);

    // end response
    res.end();
  }
}