
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

    // build url
    return label && image.thumbs[label] ? image.thumbs[label].url : image.url;
  }
}

/**
 * export new bootstrap function
 *
 * @return {media}
 */
exports = module.exports = new media ();
