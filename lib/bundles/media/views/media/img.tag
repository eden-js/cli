<media-img>
  <img src={ src () || opts.fallback } class={ opts.class } />

  <script>
    /**
     * set src
     */
    src () {
      // check if image
      if (!opts.image) return false;

      // build url
      var url  = (eden.config || opts).cdn && (eden.config || opts).cdn.url || '/public/';
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
