
// load serviceworker
if ('serviceWorker' in navigator) {
  // on load
  window.addEventListener ('load', () => {
    // set serviceworker
    eden.serviceworker = jQuery.Deferred ();

    // register serviceworker
    navigator.serviceWorker.register ('/sw.js').then ((registration) => {
      // resolve
      eden.serviceworker.resolve (registration);

      // Registration was successful
      console.log ('[EdenJS] [ServiceWorker] registration successful with scope: ', registration.scope);
    }).catch ((err) => {
      // reject
      eden.serviceworker.reject (err);

      // registration failed :(
      console.log ('[EdenJS] [ServiceWorker] registration failed: ', err);
    });
  });
}
