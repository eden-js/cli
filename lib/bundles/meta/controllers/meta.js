// use strict
'use strict';

// require dependencies
const uuid       = require ('uuid');
const config     = require ('config');
const sitemap    = require ('sitemap');
const controller = require ('controller');

/**
 * build meta controller
 *
 * @priority 90
 */
class metaController extends controller {
  /**
   * construct example controller class
   */
  constructor () {
    // run super eden
    super ();

    // bind private variables
    this._sitemap = null;

    // bind private methods
    this._compile    = this._compile.bind (this);
    this._generate   = this._generate.bind (this);
    this._middleware = this._middleware.bind (this);

    // run middleware
    this.eden.router.use (this._middleware);

    // on render
    this.eden.pre ('view.compile', this._compile);

    // generate sitemap
    if (config.get ('sitemap') && config.get ('sitemap.enabled')) {
      // generate on interval
      this._generate ();

      // set interval
      if (config.get ('sitemap.interval')) setInterval (this._generate, config.get ('sitemap.interval'));
    }
  }

  /**
   * create sitemap
   *
   * @param  {Request}   req
   * @param  {Response}  res
   *
   * @route  {get} /sitemap.xml
   *
   * @return {Promise}
   */
  async sitemap (req, res, next) {
    // check sitemap
    if (!this._sitemap) return next ();

    // return sitemap
    this._sitemap.toXML ((err, xml) => {
      // check error
      if (err) return next ();

      // set header
      res.header ('Content-Type', 'application/xml');

      // send xml
      res.send (xml);
    });
  }

  /**
   * generates xml
   *
   * @return {Promise}
   */
  async _generate () {
    // create sitemap
    let map = {
      'hostname'  : 'https://' + config.get ('domain'),
      'cacheTime' : config.get ('sitemap.cache') || 600000,
      'urls'      : [
        {
          'url'        : '',
          'priority'   : 1,
          'changefreq' : 'daily'
        }
      ]
    };

    // hook generate
    await this.eden.hook ('sitemap', map);

    // create
    this._sitemap = sitemap.createSitemap (map);

    // add to eden
    this.eden.sitemap = this._sitemap;

    // trigger sitemap
    this.eden.emit ('sitemap');
  }

  /**
   * compile view
   *
   * @param  {Object}  render
   *
   * @return {Promise}
   */
  async _compile (render) {
    // check meta
    let meta = render.state.meta || {};

    // delete meta
    delete render.state.meta;

    // create head
    if (!render.page.head) render.page.head = '';

    // sort types
    let types = Object.keys (meta).sort ();

    // loop meta
    types.forEach ((type) => {
      // sort names
      let names = Object.keys (meta[type]);

      // check if meta
      if (type === 'meta') names = names.sort ((a, b) => {
        // return a/b
        a = (meta[type][a].property || meta[type][a].name || '').split (':')[0];
        b = (meta[type][b].property || meta[type][b].name || '').split (':')[0];

        // return sorted
        return a > b ? -1 : a < b ? 1 : 0;
      });

      // loop for name
      names.forEach ((name) => {
        // let value
        let keys  = Object.keys (meta[type][name]).sort ().reverse ();
        let value = meta[type][name];

        // add to head
        render.page.head += '<' + type;

        // loop for tags
        for (let i = 0; i < keys.length; i++) {
          // check tag
          if (keys[i] === 'id') continue;

          // add tag
          render.page.head += ' ' + keys[i] + '="' + value[keys[i]] + '"';
        }

        // close tag
        render.page.head += ' />';
      });
    });
  }

  /**
   * build middleware
   *
   * @param  {request}  req Express request
   * @param  {response} res Express response
   * @param  {function} next Next callback
   *
   * @private
   */
  async _middleware (req, res, next) {
    // create meta function
    req.meta = res.meta = (type, opts) => {
      // check type and opts
      if (typeof type === 'object' || !opts) {
        // set variables
        opts = type;
        type = 'meta';
      }

      // get name
      let name = opts.id || uuid ();

      // check type
      if (type === 'title')       return req.title (opts);
      if (type === 'image')       return req.image (opts);
      if (type === 'description') return req.description (opts);

      // check opts
      if (typeof opts === 'string') {
        opts = {
          'name'    : type,
          'content' : opts
        };
        type = 'meta';
      }

      // check if meta exists
      if (!res.locals.meta) res.locals.meta = {};

      // check meta type
      if (!res.locals.meta[type]) res.locals.meta[type] = {};

      // set meta
      res.locals.meta[type][name] = opts;

      // return req
      return res;
    };

    // create description
    req.og = res.og = (name, content, id) => {
      // add description
      req.meta ({
        'id'       : id,
        'content'  : content,
        'property' : 'og:' + name
      });

      // return req
      return res;
    };

    // create description
    req.article = res.article = (name, content, id) => {
      // add description
      req.meta ({
        'id'       : id,
        'content'  : content,
        'property' : 'article:' + name
      });

      // return req
      return res;
    };

    // create description
    req.twitter = res.twitter = (name, content, id) => {
      // add description
      req.meta ({
        'id'      : id,
        'name'    : 'twitter:' + name,
        'content' : content
      });

      // return req
      return res;
    };

    // create description
    req.title = res.title = (title) => {
      // set title
      res.locals.page = res.locals.page || {};

      // set title
      res.locals.page.title = req.t (title);

      // add description
      req.og ('title', req.t (title), 'og:title');
      req.meta ({
        'id'       : 'title',
        'content'  : req.t (title),
        'itemprop' : 'name'
      });
      req.twitter ('title', req.t (title), 'twitter:title');

      // return req
      return res;
    };

    // create description
    req.description = res.description = (description) => {
      // trim description
      if (description.length > 160) {
        // get descriotion
        let split = description.substring (0, 160).split (' ');

        // slice
        description = split.splice (0, (split.length - 1)).join (' ');
      }

      // add description
      req.og ('description', description, 'og:description');
      req.meta ({
        'id'       : 'description',
        'name'     : 'description',
        'content'  : description,
        'itemprop' : 'description',
      });
      req.twitter ('description', description, 'twitter:description');

      // return req
      return res;
    };

    // create description
    req.image = res.image = (url, width, height) => {
      // add image
      req.og ('image', url);

      // set size
      if (width)  req.og ('image:width',  width);
      if (height) req.og ('image:height', height);

      // set url
      req.og ('image:url',        url);
      req.og ('image:secure_url', url);

      // set itemprop
      req.meta ({
        'content'  : url,
        'itemprop' : 'image'
      });

      // set twitter
      req.twitter ('image', url);

      // return req
      return res;
    };

    // set default title
    req.title (config.get ('title'));

    // set default
    req.og ('url', 'https://' + config.get ('domain') + req.url, 'og:url');
    req.og ('locale', req.language, 'og:locale');
    req.twitter ('card', 'summary', 'twitter:summary');
    req.twitter ('site', config.get ('title'), 'twitter:site');

    // run next
    next ();
  }
}

/**
 * export meta controller
 *
 * @type {metaController}
 */
exports = module.exports = metaController;
