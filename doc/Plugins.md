# Plugins

This is a work in progress! Api might change!

TODO:
- document `req.options` features accessible through prepareTree
- same for sanitizeCheckboxes 

## What is a Plugin?

Plugins are basic node modules. They can be used through [npm](npmjs.org) or locally.

A plugin has three major components:
- Hooks
- Router
- Job 

**Hooks** are used to print elements in the view so that the user can use our Job, our Router or both.

The **Router** allows us to add api routes to Explorer. This way you could build whole sub-applications using explorer components. A complex example that use Views on top of the router can be seen [in the Upload plugin](https://github.com/soyuka/explorer/tree/master/plugins/upload).

**Job** is a separated element for *long-polling* jobs. You don't want the user to wait for 2 minutes in front of the loading wheel before getting a response from a 40gb upload.
Those are `forked` (running in the background) and they communicate with Explorer through [IPCEE](https://github.com/soyuka/IPCEE).

## Basic structure

First expose an `index.js`: 

```javascript
module.exports = {
  job: require('./job.js'),
  hooks: require('./hooks.js'),
  router: require('./router.js'), 
  name: 'pluginName', //the name you'll call the job on
  allowKeyAccess: ['/allowThisRouteThroughKey']
}
```

None of those is requested, you could need *hooks and router*, or *job and hooks*, or why not only static hooks. 

/!\ Don't export what you don't need so that they don't get called for nothing

### Hooks structure

The hooks structure must be as following:

```javascript
/**
 * registerHooks
 * @param object config explorer configuration
 * @param string url the base url of your plugin (/p/pluginName)
 * @param mixed user the user object, null if no user
 */
function registerHooks(config, url, user) {
  return {
    directory: function(tree, path) {
      dosomethingwith(config.plugins.pluginName.myConfigValue)
      return '' //expects a <dd><a href="#"></a></dd> element
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

### Router structure

The following registers `/plugin/someplugin` route that can be call from hooks.
This will then call the Job.create method.

```javascript
/**
 * Router
 * @param router express.Router
 * @param object utils explorer utils 
 **/
function Router(router, utils) {
  var HTTPError = utils.HTTPError

  function myRoute(req, res, next) {
    //interactor allows us to call the create method of our job
    utils.interactor.ipc.send('call', 'pluginName.create', req.user, req.query.path)

    //explorer is adding a notification with info
    return res.handle('back', {info: 'Unrar launched'}, 201)
    
    //omg something failed
    return next(new utils.HTTPError("I hate mondays", 418))
  }

  //Use the prepareTree middleware if you work with the tree (security, query sanitize etc.)
  //this registers a route to /p/pluginName/
  router.get('/', utils.prepareTree, myRoute)

  //with an action hook (see below), define the route /p/pluginName/action/foo
  router.post('/action/foo', doSomething)
}

module.exports = Router
```

`utils` is an object with: 
- `.prepareTree` the [prepareTree middleware](https://github.com/soyuka/explorer/blob/master/middlewares/prepareTree.js) already instantiated
- `.interactor` the [job interactor](https://github.com/soyuka/explorer/blob/master/lib/job/interactor.js)
- `.HTTPError` used to end the request with a code/error (`return next(new HTTPError("Something is wrong", 500))`)

### Job

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
  self.ipc.send('job:notify', user.username, {message: 'Path action done!', path: path, search: search})

  //Can oviously fail with an error
  self.ipc.send('error', 'Sad story...')

  //or notify user about an error
  self.ipc.send('job:notify', user.username, {message: 'Something failed', error: true})
}

module.exports = Job
```

## Available hooks

- `directory` expects `<dd><a href="#"></a></dd>` shows below the tree
- `action` expects `<option value="plugin.method">Action</option>` shows in the select box
- `element` expects a `<a href="#"></a>` shows next to the trash icon 
- `menu` expects a `<li><a href="#"></a></li>` shows on the left of the top menu bar 

### Action hook

The action hooks don't behave like other hooks. We are hooking an `<option>` or `<optgroup>`, that will respond to the global tree form. The hook value will call a router method.

For example, `pluginName.doSomething` will call `POST /p/pluginName/action/doSomething/`:

```
function registerHooks(config) {
  return {
    action: function(tree) {
      return '<option value="pluginName.doSomething">'
    } 
  }
}

module.exports = registerHooks
```

The route is then defined like this:

```
function Router(router, utils) {

  router.post('/action/doSomething', function(req, res, next) {
    //do stuff with req.options.paths and req.options.directories
  })

  return router
}

module.exports = Router
```

You can see a working example [here](https://github.com/soyuka/explorer/tree/master/plugins/archive)

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

- [Unrar](https://github.com/soyuka/explorer-unrar)
