
// require local dependencies
let store = require ('riot/public/js/store');

/**
 * build bootstrap class
 */
class media {
  /**
   * construct bootstrap class
   */
  constructor () {

  }

  /**
   * url for image and label
   *
   * @param {Object} image
   * @param {String} label
   */
  url (image, label) {
    // get config
    let config = store.get ('config');

    // build url
    let url  = config.cdn && config.cdn.url || 'public/';
    url += image.path;

    // check if label
    if (!label) return url + '/' + image.file;

    // check if not label
    if (!image.thumbs[label]) return false;

    // check if label
    return url + '/' + image.thumbs[label];
  }
}

/**
 * export new bootstrap function
 *
 * @return {media}
 */
exports = module.exports = new media ();
