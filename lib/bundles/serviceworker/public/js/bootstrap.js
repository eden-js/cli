
// load serviceworker
if ('serviceWorker' in navigator && navigator.serviceWorker) {
  // on load
  window.addEventListener ('load', () => {
    // set serviceworker
    eden.serviceworker = new Promise ((resolve, reject) => {
      // register serviceworker
      navigator.serviceWorker.register ('/sw.js').then ((registration) => {
        // set message
        registration.send = (message) => {
          // send new promise
          return new Promise ((res, rej) => {
            // create message channel
            var channel = new MessageChannel ();

            // create port
            channel.port1.onmessage = (event) => {
              // on message
              if (event.data.error) {
                rej (event.data.error);
              } else {
                res (event.data);
              }
            };

            // This sends the message data as well as transferring messageChannel.port2 to the service worker.
            // The service worker can then use the transferred port to reply via postMessage(), which
            // will in turn trigger the onmessage handler on messageChannel.port1.
            // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
            navigator.serviceWorker.controller.postMessage (message, [channel.port2]);
          });
        };

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
