<media-img>
  <img src={ this.media.url(opts.image, opts.label) || opts.fallback } class={ opts.class || opts.classes } />

  <script>
    // Add mixins
    this.mixin('media');
  </script>
</media-img>
