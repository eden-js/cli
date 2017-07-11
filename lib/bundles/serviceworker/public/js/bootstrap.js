
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

            // await serviceworker ready
            navigator.serviceWorker.ready.then ((r) => {
              // Let's see if you have a subscription already
              return r.pushManager.getSubscription ();
            })
            .then ((subscription) => {
              // get subscription
              if (!subscription) return rej (new Error ('no subscription'));

              // You have subscription.
              // Send data to service worker
              navigator.serviceWorker.controller.postMessage (message, [channel.port2]);
            });
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
