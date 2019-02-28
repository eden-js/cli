<main-layout>

  <main-navbar />
  <div data-is={ this.view } opts={ this.state } ref="page" class="main-page" />
  <main-footer />

  <toast />

  <script>
    // Add mixins
    this.mixin('layout');
    
  </script>
</main-layout>
