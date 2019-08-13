
// require local dependencies
const Model  = require('model');
const config = require('config');

// get form helper
const formHelper = helper('form');

/**
 * create $${model.toLowerCase()} model
 */
class $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} extends Model {
  /**
   * construct $${model.toLowerCase()} model
   */
  constructor() {
    // run super
    super(...arguments);

    // bind methods
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * sanitises $${model.toLowerCase()} model
   *
   * @return {*}
   */
  async sanitise() {
    // return object
    const sanitised = {
      id         : this.get('_id') ? this.get('_id').toString() : null,
      created_at : this.get('created_at'),
      updated_at : this.get('updated_at'),
    };

    // get form
    const form = await formHelper.get('admin.$${model.toLowerCase()}');

    // add other fields
    await Promise.all((form.get('_id') ? form.get('fields') : (config.get('admin.$${model.toLowerCase()}.fields') || []).slice(0)).map(async (field, i) => {
      // set field name
      const fieldName = field.name || field.uuid;

      // set sanitised
      sanitised[fieldName] = await this.get(fieldName);
      sanitised[fieldName] = sanitised[fieldName] && sanitised[fieldName].sanitise ? await sanitised[fieldName].sanitise() : sanitised[fieldName];
      sanitised[fieldName] = Array.isArray(sanitised[fieldName]) ? await Promise.all(sanitised[fieldName].map((val) => {
        // return sanitised value
        if (val.sanitise) return val.sanitise();
      })) : sanitised[fieldName];
    }));

    // await hook
    await this.eden.hook('$${model.toLowerCase()}.sanitise', {
      sanitised,
      $${model.toLowerCase()} : this,
    });

    // return sanitised
    return sanitised;
  }
}

/**
 * export $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} model
 *
 * @type {$${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}}
 */
module.exports = $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()};
