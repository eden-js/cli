<toast>
  <div each={ position, a in this.positions } class="eden-toast eden-toast-{ position }" if={ alerts (position).length }>
    <div each={ alert, b in alerts (position) } class="alert alert-{ alert.type || 'info' } fade { alert.visible ? 'show' : 'hide' }" role="alert">
      <button type="button" class="close" if={ this.eden.frontend } data-id={ alert.id } onclick={ onDismiss }>
        <span aria-hidden="true">&times;</span>
      </button>
      <strong class="mr-3" if={ alert.title }>{ alert.title }</strong> <raw html={ alert.text } />
    </div>
  </div>

	<script>
    // do mixins
    this.mixin ('alert');

    // set positions
    this.positions = [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
      'top-full',
      'bottom-full'
    ];

    /**
     * returns alerts by placement
     *
     * @param  {String} placement
     *
     * @return {Array}
     */
    alerts (position) {
      // set alerts
      let alerts = [];

      // set placement
      for (var i = 0; i < this.alert.alerts.length; i++) {
        // check placement
        if (this.alert.alerts[i].position === position) alerts.push (this.alert.alerts[i]);
      }

      // return alerts
      return alerts;
    }

    /**
     * on dismiss function
     *
     * @param  {Event} e
     */
    onDismiss (e) {
      // prevent default
      e.preventDefault ();

      // get target
      let target = jQuery (e.target).is ('button') ? jQuery (e.target) : jQuery (e.target).closest ('button');

      // let alert
      let id    = target.attr ('data-id');
      let alert = false;

      // set placement
      for (var i = 0; i < this.alert.alerts.length; i++) {
        // check id
        if (this.alert.alerts[i].id === id) {
          // set alert
          alert = this.alert.alerts[i];
        }
      }

      // check alert
      if (alert) {
        // clear timeout
        clearTimeout (alert.timeout);

        // close
        alert.close ();
      }
    }
	</script>
</toast>
