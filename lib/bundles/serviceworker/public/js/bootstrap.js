
// load serviceworker
if ('serviceWorker' in navigator) {
  // on load
  window.addEventListener ('load', () => {
    // register serviceworker
    navigator.serviceWorker.register ('/sw.js').then ((registration) => {
      // Registration was successful
      console.log ('[EdenJS] [ServiceWorker] registration successful with scope: ', registration.scope);
    }).catch ((err) => {
      // registration failed :(
      console.error ('[EdenJS] [ServiceWorker] registration failed: ', err);
    });
  });
}
