promise-spawner [![Build Status](https://travis-ci.org/soyuka/promise-spawner.svg?branch=master)](https://travis-ci.org/soyuka/promise-spawner)
===============

Lazy nodejs spawner with stdout/stderr streams and error handling through promises

## Examples

### Basic command example

```javascript
var spawner = new Spawner()

spawner
	.spawn('echo hello', 'echo world')
	.then(function(code) {
		expect(code).to.equal(0)
		//to access out/err datas use
		console.log(this.data.out, this.data.err)
		//with this example, this.data.out will look like this:
		expect(this.data.out).to.eql(['hello', 'world'])
	})
```

### Basic failing command example

```javascript
var spawner = new Spawner()

spawner
	.spawn('exit 1', 'this will not be executed!')
	.catch(function(code) {
		console.log('Script failed with code ', code)
	})
```

### Modifiers and streaming

```javascript
var modifiers = {
	out: function(d) { return d },
	err: 'this is an error: '
}

var spawner = new Spawner(modifiers)

//spawner gives you global streams from spawned stdout and stderr
spawner.out.pipe(process.stdout)
spawner.err.pipe(process.stdout)

spawner
	//this will print "hello\n world\n err\n done\n" to the stdout
	.spawn(['echo hello', 'echo world'], 'echo err >&2', ['sleep 0', 'echo done && exit 0'])
	.then(function(code) {
	        //see below
		expect(this.data.err[0]).to.equal('err')
		
		return spawner.spawn('echo next')
	})
	.then(function(code) {
		expect(this.data.out[0]).to.equal('next')
	})

```

### Add options on the fly

```javascript
var previous = require('path').resolve(__dirname, '../')
var s = spawner.sp('echo $(pwd)"/$SP"', {env: {SP: 'test'}, cwd: previous}) 

s.then(function(code) {
  expect(this.data.out[0]).to.equal(__dirname)
})
```

Every data streamed from the spawn running script is pushed in an array that is accessible through `this.data`. This object contains two arrays : `{err: Array, out: Array}`. It is intendend to check `stdout/stderr` results when the script has run. 
To get a live data feed, use streams!

## API

```javascript
Spawner([options], [spawn_options])
```
- `options`: modifiers: `{out: Function|String, err: Function|String}`
- `spawn_options` (optional): [http://nodejs.org/api/child_process.html](http://nodejs.org/api/child_process.html)
- returns an object: 
  - `spawn`: spawn a command
  - `sp`:  shortcut to spawn
  - `out`: global out stream
  - `err`: global err stream

```javascript
spawner.spawn(...commands, [spawn_options]) or spawner.sp(...commands, [spawn_options])
```
- `command` can be an Array or a String 
- `spawn_options` (optional): [http://nodejs.org/api/child_process.html](http://nodejs.org/api/child_process.html)
- returns a `Promise` ([https://github.com/petkaantonov/bluebird/](bluebird))

Take a look at the [https://github.com/soyuka/promise-spawner/blob/master/test/index.js](tests)

## Licence

> The MIT License (MIT)
> 
> Copyright (c) 2014 soyuka
> 
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
> 
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
> 
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.
> 
