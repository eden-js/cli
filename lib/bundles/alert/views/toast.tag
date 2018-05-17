<toast>
  <div each={ position, a in this.positions } class="eden-toast eden-toast-{ position }" if={ alerts(position).length }>
    <div each={ alert, b in alerts(position) } class="alert alert-{ alert.type || 'info' } fade { alert.visible ? 'show' : 'hide' }" role="alert">
      <button type="button" class="close" if={ this.eden.frontend } data-id={ alert.id } onclick={ onDismiss }>
        <span aria-hidden="true">&times;</span>
      </button>
      <strong class="mr-3" if={ alert.title }>{ alert.title }</strong> <raw html={ alert.text } />
    </div>
  </div>

	<script>
    // Add mixins
    this.mixin('alert');

    // Set positions
    this.positions = [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
      'top-full',
      'bottom-full'
    ];

    /**
     * Returns alerts by placement
     *
     * @param  {string} placement
     *
     * @return {array}
     */
    alerts(position) {
      // Set alerts
      const alerts = [];

      // Loop alerts
      for (let i = 0; i < this.alert.alerts.length; i++) {
        // Check placement
        if (this.alert.alerts[i].position === position) alerts.push(this.alert.alerts[i]);
      }

      // Return alerts
      return alerts;
    }

    /**
     * On dismiss function
     *
     * @param {Event} e
     */
    onDismiss (e) {
      // Prevent default
      e.preventDefault();

      // Set target
      const target = jQuery(e.target).is('button') ? jQuery(e.target) : jQuery(e.target).closest('button');

      // Set alert id
      const id = target.attr('data-id');

      // Set alert
      let alert = false;

      // Loop alerts
      for (let i = 0; i < this.alert.alerts.length; i++) {
        // Check alert id
        if (this.alert.alerts[i].id === id) {
          // Set alert
          alert = this.alert.alerts[i];
        }
      }

      // Check alert
      if (alert) {
        // Clear timeout
        clearTimeout(alert.timeout);

        // Close alert
        alert.close();
      }
    }
	</script>
</toast>
