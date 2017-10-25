<admin-layout>
  <nav class="navbar navbar-expand-md navbar-dark bg-dark px-0">
    <div class="container-fluid d-block">
      <div class="row">
        <div class="col-sm-3 col-md-2">
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <a class="navbar-brand d-md-block text-center" href="/">
            { this.config.title }
          </a>
        </div>
        <div class="col-sm-9 ml-sm-auto col-md-10">
          <div class="collapse navbar-collapse" id="navbar-nav">
            <menu name="MAIN" classes={ menuClass } base="/" class="ml-auto" />
          </div>
        </div>
      </div>
    </div>
  </nav>

  <div class="container-fluid">
    <div class="row">
      <menu name="ADMIN" base="/admin" classes={ this.adminMenuClass } class="col-sm-3 col-md-2 d-none d-sm-block bg-light sidebar pt-3" />

      <main class="col-sm-9 ml-sm-auto col-md-10 pt-4 px-4" role="main">
        <div data-is={ this.view } opts={ this.state } ref="page" class="main-page" />
      </main>
    </div>
  </div>

  <toast />

  <script>
    // add layout mixin
    this.mixin ('config');
    this.mixin ('layout');

    // set menu class object
    this.menuClass = {
      'main' : 'navbar-nav'
    };
    this.adminMenuClass = {
      'main' : 'nav nav-pills flex-column',
      'item' : 'nav-item',
      'link' : 'nav-link'
    };
  </script>
</admin-layout>
