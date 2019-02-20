
// Require dependencies
const Grid        = require('grid');
const config      = require('config');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// Require models
const $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} = model('$${model.toLowerCase()}');
const Block = model('block');

// require helpers
const formHelper  = helper('form');
const fieldHelper = helper('form/field');
const blockHelper = helper('cms/block');

/**
 * Build $${model.toLowerCase()} controller
 *
 * @acl   admin
 * @fail  next
 * @mount /admin$${mount}
 */
class $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}AdminController extends Controller {
  /**
   * Construct $${model.toLowerCase()} Admin Controller
   */
  constructor() {
    // run super
    super();

    // bind build methods
    this.build = this.build.bind(this);

    // bind methods
    this.gridAction = this.gridAction.bind(this);
    this.indexAction = this.indexAction.bind(this);
    this.createAction = this.createAction.bind(this);
    this.updateAction = this.updateAction.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.createSubmitAction = this.createSubmitAction.bind(this);
    this.updateSubmitAction = this.updateSubmitAction.bind(this);
    this.removeSubmitAction = this.removeSubmitAction.bind(this);

    // bind private methods
    this._grid = this._grid.bind(this);

    // set building
    this.building = this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * build $${model.toLowerCase()} admin controller
   */
  build() {
    //
    // REGISTER BLOCKS
    //

    // register simple block
    blockHelper.block('admin.$${model.toLowerCase()}.grid', {
      acl         : ['admin.$${model.toLowerCase()}'],
      for         : ['admin'],
      title       : '$${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} Grid',
      description : '$${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} Grid block',
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // create new req
      const fauxReq = {
        query : blockModel.get('state') || {},
      };

      // return
      return {
        tag   : 'grid',
        name  : '$${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}',
        grid  : await (await this._grid(req)).render(fauxReq),
        class : blockModel.get('class') || null,
        title : blockModel.get('title') || '',
      };
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // set data
      blockModel.set('class', req.body.data.class);
      blockModel.set('state', req.body.data.state);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save(req.user);
    });

    //
    // REGISTER FIELDS
    //

    // register simple field
    fieldHelper.field('admin.$${model.toLowerCase()}', {
      for         : ['admin'],
      title       : '$${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}',
      description : '$${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} Field',
    }, async (req, field, value) => {
      // set tag
      field.tag = '$${model.toLowerCase()}';
      field.value = value ? (Array.isArray(value) ? await Promise.all(value.map(item => item.sanitise())) : await value.sanitise()) : null;
      // return
      return field;
    }, async (req, field) => {
      // save field
    }, async (req, field, value, old) => {
      // set value
      try {
        // set value
        value = JSON.parse(value);
      } catch (e) {}

      // check value
      if (!Array.isArray(value)) value = [value];

      // return value map
      return await Promise.all((value || []).filter(val => val).map(async (val, i) => {
        // run try catch
        try {
          // buffer $${model.toLowerCase()}
          const $${model.toLowerCase()} = await $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}.findById(val);

          // check $${model.toLowerCase()}
          if ($${model.toLowerCase()}) return $${model.toLowerCase()};

          // return null
          return null;
        } catch (e) {
          // return old
          return old[i];
        }
      }));
    });
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // CRUD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Index action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @icon     fa fa-building
   * @menu     {ADMIN} $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}s
   * @title    $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} Administration
   * @route    {get} /
   * @parent   $${mount}
   * @layout   admin
   * @priority 10
   */
  async indexAction(req, res) {
    // Render grid
    res.render('$${model.toLowerCase()}/admin', {
      grid : await (await this._grid(req)).render(req),
    });
  }

  /**
   * Add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route    {get} /create
   * @layout   admin
   * @return   {*}
   * @priority 12
   */
  createAction(req, res) {
    // Return update action
    return this.updateAction(req, res);
  }

  /**
   * Update action
   *
   * @param {Request} req
   * @param {Response} res
   *
   * @route   {get} /:id/update
   * @layout  admin
   */
  async updateAction(req, res) {
    // Set website variable
    let $${model.toLowerCase()} = new $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}();
    let create = true;

    // Check for website model
    if (req.params.id) {
      // Load by id
      $${model.toLowerCase()} = await $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}.findById(req.params.id);
      create = false;
    }

    // get form
    const form = await formHelper.get('admin.$${model.toLowerCase()}');

    // digest into form
    const sanitised = await formHelper.render(req, form, await Promise.all(form.get('fields').map(async (field) => {
      // return fields map
      return {
        uuid  : field.uuid,
        value : await $${model.toLowerCase()}.get(field.name || field.uuid),
      };
    })));

    // get form
    if (!form.get('_id')) res.form('admin.$${model.toLowerCase()}');

    // Render page
    res.render('$${model.toLowerCase()}/admin/update', {
      item   : await $${model.toLowerCase()}.sanitise(),
      form   : sanitised,
      title  : create ? 'Create $${model.toLowerCase()}' : `Update ${$${model.toLowerCase()}.get('_id').toString()}`,
      fields : config.get('schedule.$${model.toLowerCase()}.fields'),
    });
  }

  /**
   * Create submit action
   *
   * @param {Request} req
   * @param {Response} res
   *
   * @route   {post} /create
   * @return  {*}
   * @layout  admin
   * @upload  {single} image
   */
  createSubmitAction(req, res) {
    // Return update action
    return this.updateSubmitAction(req, res);
  }

  /**
   * Add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
   * @param {Function} next
   *
   * @route   {post} /:id/update
   * @layout  admin
   */
  async updateSubmitAction(req, res, next) {
    // Set website variable
    let create = true;
    let $${model.toLowerCase()} = new $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}();

    // Check for website model
    if (req.params.id) {
      // Load by id
      $${model.toLowerCase()} = await $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}.findById(req.params.id);
      create = false;
    }

    // get form
    const form = await formHelper.get('admin.$${model.toLowerCase()}');

    // digest into form
    const fields = await formHelper.submit(req, form, await Promise.all(form.get('fields').map(async (field) => {
      // return fields map
      return {
        uuid  : field.uuid,
        value : await $${model.toLowerCase()}.get(field.name || field.uuid),
      };
    })));

    // loop fields
    for (const field of fields) {
      // set value
      $${model.toLowerCase()}.set(field.name || field.uuid, field.value);
    }

    // Save $${model.toLowerCase()}
    await $${model.toLowerCase()}.save(req.user);

    // set id
    req.params.id = $${model.toLowerCase()}.get('_id').toString();

    // return update action
    return this.updateAction(req, res, next);
  }

  /**
   * Delete action
   *
   * @param {Request} req
   * @param {Response} res
   *
   * @route   {get} /:id/remove
   * @layout  admin
   */
  async removeAction(req, res) {
    // Set website variable
    let $${model.toLowerCase()} = false;

    // Check for website model
    if (req.params.id) {
      // Load user
      $${model.toLowerCase()} = await $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}.findById(req.params.id);
    }

    // Render page
    res.render('$${model.toLowerCase()}/admin/remove', {
      item  : await $${model.toLowerCase()}.sanitise(),
      title : `Remove ${$${model.toLowerCase()}.get('_id').toString()}`,
    });
  }

  /**
   * Delete action
   *
   * @param {Request} req
   * @param {Response} res
   *
   * @route   {post} /:id/remove
   * @title   Remove $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}
   * @layout  admin
   */
  async removeSubmitAction(req, res) {
    // Set website variable
    let $${model.toLowerCase()} = false;

    // Check for website model
    if (req.params.id) {
      // Load user
      $${model.toLowerCase()} = await $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}.findById(req.params.id);
    }

    // Alert Removed
    req.alert('success', `Successfully removed ${$${model.toLowerCase()}.get('_id').toString()}`);

    // Delete website
    await $${model.toLowerCase()}.remove(req.user);

    // Render index
    return this.indexAction(req, res);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // QUERY METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @acl   admin
   * @fail  next
   * @route {GET} /query
   */
  async queryAction(req, res) {
    // find children
    let $${model.toLowerCase()}s = await $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()};

    // set query
    if (req.query.q) {
      $${model.toLowerCase()}s = $${model.toLowerCase()}s.where({
        name : new RegExp(escapeRegex(req.query.q || ''), 'i'),
      });
    }

    // add roles
    $${model.toLowerCase()}s = await $${model.toLowerCase()}s.skip(((parseInt(req.query.page, 10) || 1) - 1) * 20).limit(20).sort('name', 1)
      .find();

    // get children
    res.json((await Promise.all($${model.toLowerCase()}s.map($${model.toLowerCase()} => $${model.toLowerCase()}.sanitise()))).map((sanitised) => {
      // return object
      return {
        text  : sanitised.name,
        data  : sanitised,
        value : sanitised.id,
      };
    }));
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // GRID METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * User grid action
   *
   * @param {Request} req
   * @param {Response} res
   *
   * @route  {post} /grid
   * @return {*}
   */
  async gridAction(req, res) {
    // Return post grid request
    return (await this._grid(req)).post(req, res);
  }

  /**
   * Renders grid
   *
   * @param {Request} req
   *
   * @return {grid}
   */
  async _grid(req) {
    // Create new grid
    const $${model.toLowerCase()}Grid = new Grid();

    // Set route
    $${model.toLowerCase()}Grid.route('/admin$${mount}/$${model.toLowerCase()}/grid');

    // get form
    const form = await formHelper.get('admin.$${model.toLowerCase()}');

    // Set grid model
    $${model.toLowerCase()}Grid.id('admin.$${model.toLowerCase()}');
    $${model.toLowerCase()}Grid.model($${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()});
    $${model.toLowerCase()}Grid.models(true);

    // Add grid columns
    $${model.toLowerCase()}Grid.column('_id', {
      sort     : true,
      title    : 'Id',
      priority : 100,
    });

    // branch fields
    await Promise.all((form.get('_id') ? form.get('fields') : config.get('$${model.toLowerCase()}.fields').slice(0)).map(async (field, i) => {
      // set found
      const found = config.get('$${model.toLowerCase()}.fields').find(f => f.name === field.name);

      // add config field
      await formHelper.column(req, form, $${model.toLowerCase()}Grid, field, {
        hidden   : !(found && found.grid),
        priority : 100 - i,
      });
    }));

    // add extra columns
    $${model.toLowerCase()}Grid.column('updated_at', {
      tag      : 'grid-date',
      sort     : true,
      title    : 'Updated',
      priority : 4,
    }).column('created_at', {
      tag      : 'grid-date',
      sort     : true,
      title    : 'Created',
      priority : 3,
    }).column('actions', {
      tag      : '$${model.toLowerCase()}-actions',
      type     : false,
      width    : '1%',
      title    : 'Actions',
      priority : 1,
    });

    // branch filters
    config.get('schedule.$${model.toLowerCase()}.fields').slice(0).filter(field => field.grid).forEach((field) => {
      // add config field
      $${model.toLowerCase()}Grid.filter(field.name, {
        type  : 'text',
        title : field.label,
        query : (param) => {
          // Another where
          $${model.toLowerCase()}Grid.match(field.name, new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
        },
      });
    });

    // Set default sort order
    $${model.toLowerCase()}Grid.sort('created_at', 1);

    // Return grid
    return $${model.toLowerCase()}Grid;
  }
}

/**
 * Export $${model.toLowerCase()} controller
 *
 * @type {$${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}AdminController}
 */
module.exports = $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}AdminController;
