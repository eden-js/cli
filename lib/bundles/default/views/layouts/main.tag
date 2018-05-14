<main-layout>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container">
      <a class="navbar-brand" href="/">
        { this.config.title }
      </a>
      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbar-nav">
        <menu name="MAIN" classes={ menuClass } class="ml-auto" />
      </div>
    </div>
  </nav>

  <div data-is={ this.view } opts={ this.state } ref="page" class="main-page" />

  <toast />

  <script>
    // Add mixins
    this.mixin ('config');
    this.mixin ('layout');

    // Set menu class object
    this.menuClass = {
      'main' : 'navbar-nav'
    };
  </script>
</main-layout>
