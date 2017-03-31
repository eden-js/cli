
// do Promise
const Promise = require ('bluebird');

// load serviceworker
if ('serviceWorker' in navigator) {
  // on load
  window.addEventListener ('load', () => {
    // set serviceworker
    eden.serviceworker = new Promise ((resolve, reject) => {
      // register serviceworker
      navigator.serviceWorker.register ('/sw.js').then ((registration) => {
        // resolve
        resolve (registration);

        // Registration was successful
        console.log ('[EdenJS] [ServiceWorker] registration successful with scope: ', registration.scope);
      }).catch ((err) => {
        // reject
        reject (err);

        // registration failed :(
        console.log ('[EdenJS] [ServiceWorker] registration failed: ', err);
      });
    });
  });
}
