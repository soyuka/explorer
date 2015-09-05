# Plugins

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
  router: require('./router.js'), //you might not need it if you're hooking an action on paths
  name: 'pluginName' //the name you'll call the job on
}
```

None of those is requested, you could need *hooks and router*, or *job and hooks*, or why not only static hooks. 

### Hooks structure

The hooks structure must be as following:

```javascript
/**
 * registerHooks
 * @param object config explorer configuration
 */
function registerHooks(config) {
  return {
    directory: function(tree) {
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
      return '' //expects a <li><a href="#"></a></li>
    }
  }
}
```

/!\ Skip hooks you don't need so that they don't get called for nothing

### Router structure

The following registers `/plugin/someplugin` route that can be call from hooks.
This will then call the Job.create method.

```javascript
/**
 * Router
 * @param Express app our app instances
 * @param object utils explorer utils 
 **/
function Router(app, utils) {
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
  //Use the /plugin/pluginName path to avoid conflicts
  //this registers a route to /plugin/unrar
  app.get('/plugin/pluginName', utils.prepareTree, myRoute)
}

export default Router
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
 * @param Stat stat the Stat used for notifications
 **/
function Job(ipc = null, stat) {
  if(!(this instanceof Job)) { return new Job(ipc, stat) }
  this.ipc = ipc
  this.stat = stat
}

Job.prototype.create = function(user, path) {
  var self = this
  
  //Notify user that we've started
  self.stat.add(user.username, {message: 'GO!'})

  //do some async stuff

  //Notify user it's good to go! A link will be set to /search?path=$path&search=$name
  return self.stat.add(user.username, {message: 'Path action done!', path: path, name: name})

  //Can oviously fail with an error
  return self.stat.add(user.username, {error: 'Sad story...'})

   //IPC can help testing (https://github.com/soyuka/explorer/blob/d58a6cb6eda3aa7b15a81326eaae2e5fd9c619ce/test/api/archive.js#L34) or maybe for sockets 
  self.ipc.send('archive.create', user.username, data)
  
  //Or to log system errors
  self.ipc.send('error', err.stack)
}

/**
 * Called to get our job notifications
 **/
Job.prototype.info = function() {
  return this.stat.get()
}

/**
 * Called to remove our notifications
 **/
Job.prototype.clear = function(user) {
  return this.stat.remove(user)
}

module.exports = Job
```

## Available hooks

- `directory` expects `<dd><a href="#"></a></dd>` shows below the tree
- `action` expects `<option value="plugin.method">Action</option>` shows in the select box
- `element` expects a `<a href="#"></a>` shows next to the trash icon 
- `menu` expects a `<li><a href="#"></a></li>` shows on the left of the top menu bar 

### Action hook

The action hook expects an option value of "plugin.method" and will call your plugin method. To do so, you need to export routes in your `index.js` ([example](https://github.com/soyuka/explorer/blob/master/plugins/archive/index.js#L20)).

## Activate

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

To debug your plugin activity you should launch explorer like this:

```bash
DEBUG="explorer:job" babel-node index.js
```

## Examples

- [Unrar](https://github.com/soyuka/explorer-unrar)
