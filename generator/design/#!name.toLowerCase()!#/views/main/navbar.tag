<main-navbar>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container">
      <a class="navbar-brand" href="/">
        { this.config.title }
      </a>
      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#main-navbar" aria-controls="main-navbar" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="main-navbar">
        <menu name="MAIN" classes={ menuClass } class="ml-auto" />
      </div>
    </div>
  </nav>

  <script>
    // do mixins
    this.mixin('config');

    // Set menu class object
    this.menuClass = {
      'main' : 'navbar-nav'
    };

  </script>
</main-navbar>
