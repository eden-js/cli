## Making a simple app in EdenJS

- Follow the instructions on GitHub to install
- Copy the `config.example.js` to `config.js` and make sure you change the `config.domain` to match the domain (in my case, it's `localhost`)
- Run `gulp` (EdenJS will automatically refresh when you change your code!)
- Go to `http://localhost:1337/` and you should see a welcome page!

In EdenJS, everything is done inside a `bundle` as seen in `/lib/bundles` and the reasoning behind this is you can reuse your bundles in each project you do to quicken development time. 

To get started, let's copy `/lib/bundles/example/` to `/app/bundles/myexample`. Once this is copied, go through and change all the file names from `example` to `myexample` then update all the instances inside the files. 

i.e. `class example extends controller ` becomes `class myexample extends controller` 

Once that's all done, we'll need to make our first route so people can interact with the `myexample` bundle. 

Open up `/app/bundles/myexample/controllers/dental.js` and add your new binding method into the constructor:

```javascript
  constructor () {
    // run super
    super ();
    // bind methods
    this.indexAction = this.indexAction.bind (this);
  }
```

Now you can add your new method called `indexAction` below:

```javascript
  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @name     MyExample
   * @route    {get} /myexample
   * @menu     {MAIN} MyExample
   * @priority 1
   */
  async indexAction (req, res) {
    res.render ('myexample');
  }
```

Notice in the comments for this method we have `@name`, `@route` and `@menu`? Those are our descriptors for our new method. It means that if someone were to go to `http://localhost:1337/myexample` then it will fire this method and also show the menu item for us all automatically. 

Let's add something into the database now.

Make a new method (don't forget to bind it inside the constructor) and make it fire whenever someone visits `http://localhost:1337/mytest`.

Inside this method, we'll add some data to our database. (If you want a GUI to help you see what the database is doing, download `Robo3T`).

```javascript
const cars = model('myexample');

/**
 * build myexample controller
 */
async testAction(req, res) {
  let Car = new cars({
      name: 'Holden Commodore',
      color: 'Blue',
      price: '50,0000',
      seller: {
          name: 'Alex Taylor',
          email: 'alex@edenjs.com'
      }
  });

  await Car.save();

  res.render('myexample');
}
```

Now go to `http://localhost:1337/mytest` and you should see the `Hello World`. Now open Robo3T and check the `Cars` collection, and you'll see it.

Congratulations. You've just built your first model. Now we need to work with it.

Make another method and in this one we can do:

```javascript
async anotherTestAction(req, res) {
    let car = await Promise.all(await cars.find()).map ((Car) => Car.sanitise()));
    console.log(car);
  
    res.render('home')
}
```



Save your changes, and watch the console. You should receive an error like: `TypeError: Car.sanitise is not a function` - that's what we were after.

Now we need to make a sanitise function in our model. Open up `/app/bundles/myexamplemodels/myexample.js` and add:

```javascript
  /**
   * sanitises car
   *
   * @return {*}
   */
  async sanitise () {

    let sanitised = {
      'name': this.get ('name'),
      'seller': this.get ('seller'),    
    };

    // return sanitised
    return sanitised;
  }
```



Save your changes, watch the console  while EdenJS finishes reloading then go to your page. You'll see both the name and seller inside a JSON object. Successfully pulled from the database! 





