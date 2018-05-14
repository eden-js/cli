/**
 * Create Media class
 */
class Media {

  /**
   * Construct Media class
   */
  constructor () {
    // Bind public methods
    this.url = this.url.bind (this);
  }

  /**
   * Get url for image and label
   *
   * @param   {Object} image
   * @param   {String} label
   *
   * @returns {String}
   */
  url (image, label) {
    // Check image
    if (!image) return;

    // Build url
    return label && image.thumbs[label] ? image.thumbs[label].url : image.url;
  }
}

/**
 * Export new Media instance
 *
 * @return {Media}
 */
exports = module.exports = new Media ();
