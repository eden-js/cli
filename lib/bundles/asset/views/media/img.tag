<media-img>
  <img src={ src () || opts.fallback } class={ opts.class || opts.classes } />

  <script>

    /**
     * set src
     */
    src () {
      // check if image
      if (!opts.image) return false;

      // get config
      let config = this.eden.get ('config');

      // build url
      let url  = config.cdn && config.cdn.url ? (config.cdn.url + 'public/') : '/public/';
          url += opts.image.path;

      // check if label
      if (!opts.label) return url + '/' + opts.image.file;

      // check if not label
      if (!opts.image.thumbs[opts.label]) return false

      // check if label
      return url + '/' + opts.image.thumbs[opts.label];
    }
  </script>
</media-img>
