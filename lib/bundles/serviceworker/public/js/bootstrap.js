
// load serviceworker
if ('serviceWorker' in navigator && navigator.serviceWorker) {
  // on load
  window.addEventListener ('load', () => {
    // set serviceworker
    eden.serviceworker = new Promise (async (resolve, reject) => {
      // run try/catch
      try {
        // register serviceworker
        let registration      = await navigator.serviceWorker.register ('/sw.js');
        let registrationReady = await navigator.serviceWorker.ready;

        // await subscription
        let subscription = await registrationReady.pushManager.getSubscription ();

        // set variables
        eden.sw = {
          'send' : (message) => {
            // send new promise
            return new Promise (async (res, rej) => {
              // await ready
              await (await navigator.serviceWorker.ready).pushManager.getSubscription ();

              // create message channel
              let channel = new MessageChannel ();

              // create port
              channel.port1.onmessage = (event) => {
                // on message
                if (event.data.error) {
                  rej (event.data.error);
                } else {
                  res (event.data);
                }
              };

              // get subscription
              if (!subscription) return rej (new Error ('no subscription'));

              // You have subscription.
              // Send data to service worker
              navigator.serviceWorker.controller.postMessage (message, [channel.port2]);
            });
          },
          'registration' : registration,
          'subscription' : subscription
        };

        // resolve
        resolve (registration);

        // Registration was successful
        console.log ('[EdenJS] [ServiceWorker] registration successful with scope: ', registration.scope);
      } catch (e) {
        // reject
        reject (e);

        // registration failed :(
        console.log ('[EdenJS] [ServiceWorker] registration failed: ', e.toString ());
      }
    });
  });
}
