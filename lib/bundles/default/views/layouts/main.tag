<main-layout>
  <nav class="navbar navbar-toggleable-md navbar-light bg-faded">
    <div class="container">
      <button class="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbar-nav" aria-controls="navbar-nav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <a class="navbar-brand" href="/">
        { this.config.title }
      </a>
      <div class="collapse navbar-collapse" id="navbar-nav">
        <menu name="MAIN" classes={ menuClass } class="ml-auto" />
      </div>
    </div>
  </nav>
  <div ref="page"></div>
  <toast />

  <script>
    // add layout mixin
    this.mixin ('config');
    this.mixin ('layout');

    // set menu class object
    this.menuClass = {
      'main' : 'navbar-nav'
    };
  </script>
</main-layout>
