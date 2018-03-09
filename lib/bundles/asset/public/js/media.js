
// require local dependencies
const store = require ('default/public/js/store');

/**
 * build media class
 */
class media {

  /**
   * construct media class
   */
  constructor () {

  }

  /**
   * url for image and label
   *
   * @param {Object} image
   * @param {String} label
   *
   * @returns {String}
   */
  url (image, label) {
    // get config
    let config = store.get ('config');

    // build url
    let url = (config.cdn && config.cdn.url ? (config.cdn.url + 'public/') : '/public/') + image.path;

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
