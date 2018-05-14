<home-page>
  <section class="jumbotron text-xs-center">
    <div class="container">
      <h1 class="display-3 mb-4">
        Welcome to { this.config.title }
      </h1>

      <p class="lead text-muted mb-5">
        Let's call this "Hello World". You will need to create your own bundles within <code>app/bundles/[bundle name]</code> to start!
      </p>

      <p>
        <a class="btn btn-lg btn-primary mr-3" href="//edenjs.com" role="button">Read the docs »</a>

        <a class="btn btn-lg btn-secondary" href="//github.com/eden-js/eden" role="button">Read the source »</a>
      </p>
    </div>
  </section>

  <script>
    // Add mixins
    this.mixin ('config');
  </script>
</home-page>
