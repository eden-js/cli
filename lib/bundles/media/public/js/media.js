/**
 * Created by Awesome on 2/6/2016.
 */

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
    // check if image
    if (!image) return false;

    // build url
    let url  = '/public/';
        url += image.path;

    // check if label
    if (!label) return url + image.file;

    // check if not label
    if (!image.thumbs[label]) return false

    // check if label
    return url + image.thumbs[label];
  }
}

/**
 * create window router
 *
 * @type {media}
 */
window.eden.media = new media ();

/**
 * export new bootstrap function
 *
 * @return {media}
 */
module.exports = window.eden.media;
