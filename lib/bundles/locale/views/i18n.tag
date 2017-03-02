<i18n>
  <span ref="l"></span>
  <i ref="o" style="display:none;"><yield /></i>

  <script>
    // require mixins
    this.mixin ('i18n');

    /**
     * on mount function
     *
     * @param {Event} 'mount'
     */
    this.on ('mount', () => {
      // set innerHTML
      this.refs.l.innerHTML = this.i18n (this.refs.o.innerHTML);
    })
  </script>
</i18n>
