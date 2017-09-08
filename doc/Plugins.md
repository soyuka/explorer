# Explorer plugins development guide

*Beta*

## What is a Plugin?

Plugins are basic node modules. They can be used through [npm](npmjs.org) or locally.

A plugin has three major components:
- Hooks
- Router
- Job 

**Hooks** are used to print elements in the view so that the user can use our Job, our Router or both.

The **Router** allows us to add api routes to Explorer. This way you could build whole sub-applications using explorer components.

**Job** is a separated element for *long-polling* jobs. You don't want the user to wait for 2 minutes in front of the loading wheel before getting a response from a 40gb upload.
Those are `forked` (running in the child processes) and they communicate with Explorer through [IPCEE](https://github.com/soyuka/IPCEE).

## Main structure

First expose an `index.js`: 

```javascript
module.exports = {
  job: require('./job.js'),
  hooks: require('./hooks.js'),
  router: require('./router.js'), 
  name: 'pluginName', //the name you'll call the job on, default to the configuration name
  //The following is useful to make a plugin link shareable:
  allowKeyAccess: ['/allow'] //allows /p/pluginName/allow to the list of key-accessible path. 
}
```

None of those is requested, you could need *hooks and router*, or *job and hooks*, or why not, only static hooks. 

/!\ Don't export what you don't need so that they don't get called for nothing

## Router

When exporting a router, you'll get an [Express Router](http://expressjs.com/4x/api.html). It is mounted on `/p/pluginName`.

That said the following adds a `GET` route on `/p/pluginName` which will respond by `ok`:

```
function Router(router, utils) {
  router.get('/', function(req, res, next) {
    return res.send('ok') 
  })
}
```

### Example

```javascript
/**
 * Router
 * @param router express.Router
 * @param object utils explorer utils 
 **/
function Router(router, job, utils, config) {

  function myRoute(req, res, next) {

    if(ok) {
      //explorer is adding a notification with info
      return res.handle('back', {info: 'Ok!'}, 200)
    }
    
    //omg something failed
    return next(new utils.HTTPError("I hate mondays", 418))
  }


  //GET /p/pluginName/ 
  //Use the prepareTree middleware if you work with the tree (security, query sanitize etc.)
  router.get('/', utils.prepareTree, myRoute)

  //DELETE /p/pluginName/something
  router.delete('/something', myRemovalRoute)
}

module.exports = Router
```

A router can call a Job method through the interactor [(see more below)](https://github.com/soyuka/explorer/blob/master/doc/Plugins.md#usage):

```javascript
  router.post('/action/longjob', function(req, res) {
    //interactor allows us to call the create method of our job (see below)
    job.call('longjob', req.user, req.query.path)
    return res.handle('back', {info: 'Launched'}, 201)
  })
```

`prepareTree` checks the required path according to the user root path. Note that by using it, you'll be able to get a path's tree in no time:

```javascript
router.get('/mytree', utils.prepareTree, function(req, res, next) {
 utils.tree(req.options.path, req.options)
 .then(function(tree) {
  return res.json(tree)
 })
 .catch(next)
})
```

Here, `utils` is an object with: 
- `.prepareTree` the [prepareTree middleware](https://github.com/soyuka/explorer/blob/master/middlewares/prepareTree.js) already instantiated
- `.HTTPError` used to end the request with a code/error (`return next(new HTTPError("Something is wrong", 500))`)
- `.tree` is the [main tree algorithm](https://github.com/soyuka/explorer/blob/master/lib/tree.js)
- `.cache` the [cache instance](https://github.com/soyuka/explorer/blob/master/lib/cache/cache.js)
- `.notify` is the [notifcation cache by user](https://github.com/soyuka/explorer/blob/master/lib/job/notify.js)

## Hooks

### Available hooks

- `above` expects `<div class="row"></div>` shows above the tree
- `below` expects `<a class="button small" href="#"></a>` shows below the tree
- `action` expects `<option value="plugin.method">Action</option>` shows in the select box. It behaves differently than normal hooks (see below)
- `element` expects a `<a href="#"></a>` shows next to the trash icon 
- `menu` expects a `<li><a href="#"></a></li>` shows on the left of the top menu bar 

### Full example

The hooks structure must return an object or a promise which results in a hooks map:

```javascript
/**
 * registerHooks
 * @param object config explorer configuration
 * @param mixed user the user object, null if no user
 * @param utils (see below)
 */
function registerHooks(config, user, utils) {
  return {
    above: function(tree, path) {
      dosomethingwith(config.plugins.pluginName.myConfigValue)
      return '' //expects a <div class="row"></div> element
    },
    below: function(tree, path) {
      dosomethingwith(config.plugins.pluginName.myConfigValue)
      return '' //expects a <a class="button small"> element
    },
    action: function(tree) {
      return '' //expects a <option value="plugin.method">Action</option>
    },
    element: function(element) {
      return '' //expects a <a href="#"></a> 
    },
    menu: function() {
      return '' //expects a <li><a href="/p/pluginName/"></a></li>
    }
  }
}
```

*The core plugin `move` is using a promise - [see here](https://github.com/soyuka/explorer/blob/master/plugins/move/hooks.js)*

Here it's the same as before. If you don't need a hook, just skip it.

`utils` is an object with: 
- `.cache` the [cache instance](https://github.com/soyuka/explorer/blob/master/lib/cache/cache.js)
- `.notify` is the [notifcation cache by user](https://github.com/soyuka/explorer/blob/master/lib/job/notify.js)

`registerHooks` will be called on each request, internally it's a middleware that exports locals (your hooks).

### Action hook

The action hooks does not behave like other hooks. We are hooking an `<option>` or `<optgroup>`, that will respond to the global tree form. The hook value will be therefore binded to a specific route.

For example, an opiton value of `pluginName.doSomething` will call `POST /p/pluginName/action/doSomething`:

```javascript
function registerHooks(config, user, utils) {
  return {
    action: function(tree) {
      return '<option value="pluginName.doSomething">'
    } 
  }
}

module.exports = registerHooks
```

The route is then defined like this:

```javascript
function Router(router, utils) {

  router.post('/action/doSomething', function(req, res, next) {
    //do stuff with req.options.paths and req.options.directories
  })

  return router
}

module.exports = Router
```

This routes goes through `prepareTree` and `sanitizeCheckboxes` middleware. You can then work with a safe `req.options`.
Those are the properties that can be useful:

```javascript
req.options = {
  root: '/Users/soyuka/explorer',
  path: '/Users/soyuka/explorer',
  parent: '/Users/soyuka/explorer',
  directories:
   [ '/Users/soyuka/explorer/bin',
     '/Users/soyuka/explorer/scripts' ],
  paths: [ '/Users/soyuka/explorer/index.js' ] 
}
```

## Job

### Basic structure

```javascript
/**
 * Job
 * @param IPCEE ipc our process communication instance
 **/
function Job(ipc) {
  if(!(this instanceof Job)) { return new Job(ipc) }
  this.ipc = ipc || null
}

Job.prototype.create = function(user, path) {
  var self = this
  
  //Notify user that we've started, job is your plugin name
  self.ipc.send('job:notify', user.username, {message: 'GO!'})

  //do some async stuff

  //Notify user it's good to go! A link will be set to /search?path=$path&search=$search
  self.ipc.send('myplugin:notify', user.username, {message: 'Path action done!', path: path, search: search})

  //Can oviously fail with an error
  self.ipc.send('myplugin:notify', user.username, {message: 'Something failed', error: true})
}

module.exports = Job
```

### Usage

To use the job, you'll go through `utils.interactor` and simply call a job method.

Taking an async zip method: 

```javascript
Job.prototype.zip = function(user, paths) {
  var self = this
  //notify must always be use with an user
  self.ipc.send('myplugin:notify', user.username, {message: 'Zip starting'})  
  //do zipping and notify back, when path is present 
  self.ipc.send('myplugin:notify', user.username, {
    message: 'Zipped dude!',
    path: 'where/is/zip', //when path is present, notify is linked to it
    search: 'zipped.rar' //adds a search to the notification link
  })
}
```

This method can be called, like this: 

```javascript
router.post('/action/zip', function(req, res) {
  //                     call myplugin.Job.zip(req.user, paths)
  utils.interactor.send('call', 'myplugin.zip', req.user, {
    paths: req.options.paths,
    directories: req.options.directories,
  })

  return res.handle('back', {info: 'Zip started'})
})
```

You can also get a get a resulting value from the job:

```javascript
//job.js
Job.prototype.progress = function() {
  return this.progress
}
//router.js
router.get('/progress', function(req, res) {
  utils.interactor.ipc.once('myplugin:progress', function(progress) {
    return res.json({progress: progress})
  })

  utils.interactor.send('get', 'myplugin.progress', {foo: bar})
})
```

## Configuration

### NPM

Hosted on npm, you can install the plugin with `explorer install plugin`, it must be added to the `config.yml`:

```yaml
plugins:
  pluginName: 
    module: 'explorer-pluginName' # the npm package name
```

### Local

Put the plugin in `path-to-explorer/plugins/pluginName` and add it to the config:

```yaml
plugins:
  pluginName: {}
```
## Examples

### Core plugins
- [Archive](https://github.com/soyuka/explorer/blob/master/plugins/archive)
- [Upload](https://github.com/soyuka/explorer/blob/master/plugins/upload)
- [Move](https://github.com/soyuka/explorer/blob/master/plugins/move)

### NPM hosted

- [Unrar](https://github.com/soyuka/explorer-unrar) Launch unrar in the current path.
- [cksfv](https://github.com/soyuka/explorer-cksfv) Checks a `.sfv` file.
- [m3u](https://github.com/soyuka/explorer-m3u) Generates an `m3u` playlist from audio files
