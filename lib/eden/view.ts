// Require local dependencies
import eden from 'eden';
import config from 'config';

/**
 * Create View class
 */
class View {
  /**
   * Construct View class
   */
  constructor() {
    // Bind public methods
    this.render = this.render.bind(this);
  }

  /**
   * Create email template
   *
   * @param  {string} template
   * @param  {object} options
   *
   * @return {Promise}
   */
  async email(template, options) {
    const setOptions = { ...options };

    // Set config
    setOptions.config = {
      cdn    : config.get('cdn') || false,
      logo   : config.get('logo') || false,
      title  : config.get('title'),
      domain : config.get('domain'),
      socket : config.get('socket'),
    };

    // Run email compile hook
    await eden.hook('email.compile', setOptions);

    // Set compiled
    let compiled = false;

    // Create compile string
    await eden.hook('email.render', {
      setOptions,
      template,
    }, async () => {
      // Compile email
      compiled = await eden.email(template, setOptions);
    });

    // Return compiled email
    return compiled;
  }

  /**
   * Render view
   *
   * @param  {string} path
   * @param  {object} opts
   *
   * @return {*}
   */
  async render({ req, res, next }, page, opts = {}) {
    // add locals
    opts = Object.assign({}, res.locals, opts);

    // Set route
    const route = req.route || {};

    // Run view route hook
    await eden.hook('view.route', route);

    // Set render Object
    const render = {
      state : opts,

      // mount specific logic
      page : {
        head  : res.head,
        foot  : res.foot,
        style : res.style,
        title : opts.title || route.title,
      },
      mount : {
        page,
        url    : req.originalUrl,
        path   : route.path  || '404',
        layout : opts.layout || route.layout || 'main',
      },
      config : {
        cdn         : config.get('cdn') || false,
        logo        : config.get('logo') || false,
        title       : opts.website || config.get('title'),
        domain      : config.get('domain'),
        socket      : config.get('socket'),
        direction   : config.get('direction') || 2,
        environment : config.get('environment') || 'dev',
      },

      // other variables
      timer  : req.timer  || {},
      isJSON : req.isJSON || false,

      // other mounts
      helpers : {},
    };

    // Log timing
    eden.logger.log('debug', `${route.path} route in ${new Date().getTime() - render.timer.start}ms`, {
      class : (route && route.method) ? `${route.method.toUpperCase()} ${route.file}.${route.fn}` : 'No Route',
    });

    // Run view state hook
    await eden.hook('view.compile', { req, res, page, render, opts }, () => {

    });

    // check json
    if (render.isJSON) {
      // delete
      ['timer', 'config', 'helpers'].forEach((key) => {
        delete render[key];
      });

      // set done
      let done = null;

      // Run view json hook
      await eden.hook('view.json', { req, res, page, render, opts }, () => {
        // stringify
        done = JSON.stringify(render);
      });

      // return done
      return done;
    }

    // Set render timer
    render.timer.render = new Date().getTime();

    // Do try/catch
    try {
      // start page
      let page = `<!DOCTYPE html><html lang="${opts.language}"><head>`;

      // Set head
      let head = '';

      // Run view head hook
      await eden.hook('view.head', { req, res, page, render, opts, head }, () => {
        // Add to head
        head += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';

        // Check config
        if (config.get('direction') === 0) {
          head += `<title>${opts.title}</title>`;
        } else if (config.get('direction') === 1) {
          head += `<title>${render.config.title}${opts.title ? ` | ${opts.title}` : ''}</title>`;
        } else {
          head += `<title>${opts.title ? `${opts.title} | ` : ''}${render.config.title}</title>`;
        }

        // Continue head
        head += render.page.style || '';
        head += `<link rel="stylesheet" href="${config.get('cdn.url') || '/'}public/css/app.min.css${config.get('version') ? `?v=${config.get('version')}` : ''}" async data-eden="head-start" id="eden-prehead">`;
        head += render.page.head || '';
        head += '<meta name="eden" value="head-end" data-eden="head-end" id="eden-posthead">';
      });

      // Add head to page
      page += `${head}</head>`;
      page += `<body${res.class ? ` class="${res.class}"` : ''}>`;

      // Set compiled element
      let compiled = '';

      // Run view render hook
      await eden.hook('view.render', { req, res, page, render, opts, head }, async () => {
        // Compile view
        compiled = await eden.view(render);
      });

      // helpers
      delete render.helpers;

      // Stringify render frontend
      const renderFrontend = JSON.stringify(render);

      // Add to page
      page += compiled;

      // Set foot
      let foot = '';

      // Run view foot hook
      await eden.hook('view.foot', { req, res, page, render, opts, foot }, () => {
        // Add to foot
        foot += `<!-- DATA.START --><script data-eden="before-user" id="eden-preuser">window.eden = JSON.parse(decodeURIComponent("${encodeURIComponent(renderFrontend)}"));</script><!-- DATA.END -->`;
        foot += '<!-- USER.START -->';

        // Add to foot
        foot += '<!-- USER.END -->';
        foot += `<script data-eden="script" id="eden-script" type="text/javascript" src="${config.get('cdn.url') || '/'}public/js/app.min.js${config.get('version') ? `?v=${config.get('version')}` : ''}" async></script>`;
        foot += render.page.foot || '';
      });

      // Add foot to page
      page += `${foot}</body>`;
      page += '</html>';

      // Log rendered to debug
      eden.logger.log('debug', `${render.mount.path} rendered in ${new Date().getTime() - render.timer.start}ms`, {
        class : (route && route.method) ? `${route.method.toUpperCase()} ${route.file}.${route.fn}` : 'No Route',
      });

      // Run callback
      return page;
    } catch (e) {
      // Run error
      eden.error(e);

      // Run callback
      return null;
    }
  }
}

/**
 * Export view class
 *
 * @type {View}
 */
export default new View();
