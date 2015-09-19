# ![Logo](https://raw.githubusercontent.com/soyuka/explorer/master/client/logo.png) Explorer [![Build Status](https://travis-ci.org/soyuka/explorer.svg?branch=master)](https://travis-ci.org/soyuka/explorer)

Explore and share. Highly-configurable directory listing made with nodejs.

![Screenshot](https://raw.githubusercontent.com/soyuka/explorer/master/doc/screen.png)

- [Requirements](#requirements)
- [Install](#install)
- [Configuration](#configuration)
- [Update](#update)
- [More installation methods](#more-installation-methods)
- [Plugins](#plugins)
- [Development](#development)
- [Performances](#performances)
- [Why](#why)

## Requirements

- nodejs (> 0.11 with harmony support) 

### Installing nodejs with [nvm](https://github.com/creationix/nvm)

```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash
nvm install 0.12 #nvm ls-remote to see available versions
nvm alias default 0.12
nvm use default
```

## Install

```bash
npm i pm2 -g
pm2 install xplorer
```

Go to IP:4859, login with `admin:admin` Don't forget to change the password.

With pm2 configuration file is located in `~/.config/explorer`

You may want to create your own HTTPS certs or disable it ([see below](#certs)).

[More installation methods](#more-installation-methods)

## Configuration

```yaml
---
search: 
  # Available: pt, ack, find, mdfind, custom, native
  method: 'native' 
  # Custom search command (${search} will be replaced by the string) 
  command: "pt --nocolor --nogroup -l -i '${search}' ." # not used by native
  maxDepth: 10 # Default 10
  concurrency: 100 # Default 100 (only used with native search)
  # String match score (only used with native search)
  maxScore: 0.5
pagination:
  # Maximum number of items per page
  limit: 10 # Default 100
# Be carefull with this next section as it will have an impact on performances
tree:
  # When calculating directory size we stop at the max_depth
  maxDepth: 10 #Default 10
  concurrency: 100 #Default 100
remove: 
  # 'mv' will move files to a trash directory
  # 'rm' will delete files
  # empty to disable deletion
  method: 'mv' # default is to mv (move instead of remove)
  path: './trash'
# disable with:
# archive: false
archive:
  path: './tmp'
# disable with:
# upload: false
upload:
  path: './upload'
  concurrency: 10
  maxSize: '50mb' # default to 50mb see https://github.com/expressjs/body-parser#limit
  maxCount: 10 # max number of files 
# note that path values will be overridden by the user path if set
# path will be created if non-existant
database: './data/users' # don't touch if you don't know what you're doing
app_root: '/' # app root for client ressources
session_secret: 'Some string here' #Change this
port: 4859
https:
  port: 6859
  enabled: true # default option!
  key: './certs/key.pem' # change those are dummies
  cert: './certs/cert.pem'
plugins: # those are enable by default, use below options to disable them
  upload: {}
  archive: {}
dev: false # more verbose error (stack)
```

The `config.yml` will be searched in:
- `~/.config/explorer/config.yml`
- `./config/explorer/config.yml` (relative to the script directory!)

To reload the configuration you'll need to restart the script `pm2 restart xplorer`!

See also: [minimal](https://github.com/soyuka/explorer/blob/master/config.example.min.yml), [dev](https://github.com/soyuka/explorer/blob/master/config.example.dev.yml)

## HTTP(S)

### Nginx

```nginx
upstream explorer {
  server localhost:4859 #port can be changed in the config.yml
}

server {
  listen 80;

  location / { #if you want to change this, change `app_root` in the config.yml
    proxy_pass http://explorer/ 
  }
}
```

### Certs

You can either change the paths in the `config.yml`, or replace those located in your configuration path (see [Configuration](#configuration)).

### Rss

By calling your tree url or a search path (`localhost:4859/search?search=*.mkv&key=my-key`), set the `Accept` header to `application/rss+xml`:

```bash
http GET localhost:4859/?key=get-your-key-from-settings Accept:application/rss+xml
```

## Update

[From 1.x to 2.x see configuration migration](https://github.com/soyuka/explorer/blob/master/doc/Migration.md).

### As a pm2 module

```
pm2 install xplorer
```

### From tarball

```
cd /path/to/your/explorer
curl -L https://github.com/soyuka/explorer/archive/v1.0.6.tar.gz | tar xz --strip-components 1
npm rebuild
```
## More installation methods 

### Tarball package

Download, unpack, configure, launch :

```bash
curl -L https://github.com/soyuka/explorer/archive/v2222.2.6.2.tar.gz | tar xz
cd explorer-2222.2.6.2
cp config.example.yml config.yml #copy default configuration
cp users.default data/users #copy default database
npm rebuild
```

#### Mirror

```bash
curl -L http://lab.wareziens.net/soyuka/explorer/repository/archive.tar.gz?ref=v2222.2.6.2 | tar xz
```

Check `IP:4859`, login with `admin:admin`. Don't forget to change the password!

#### From git

```
git clone git@github.com:soyuka/explorer
cd explorer
cp config.example.yml config.yml #copy default configuration
cp users.default data/users #copy default database
npm install #install packages
```

### Run

Installed as a pm2 module explorer will already be daemonized. 

#### Development

```bash
npm i babel-node -g
DEBUG="explorer:*" babel-node index.js
```

#### Daemonize with pm2

```bash
npm i pm2 -g
pm2 start --node-args="--harmony" --name explorer index.js
```

Or

```bash
pm2 --next-gen-js --name explorer start index.js
```

Or with babel-node:

```bash
npm i pm2 babel-node -g
pm2 --interpreter babel-node --name explorer start index.js
```

## Plugins

### Install a plugin:

```
explorer plugin install [plugin-name]
```

**See `explorer --help` for more commands.**

### Configure

In the `config.yml`:

```
plugins:
  name:
    module: 'npm-package-name'
  local-name: {} # located in path/to/explorer/plugins/local-name
```

### Available plugins:

- [explorer-unrar](https://github.com/soyuka/explorer-unrar)

```
plugins:
  unrar:
    module: 'explorer-unrar' 
```

- [explorer-cksfv](https://github.com/soyuka/explorer-cksfv)

```
plugins:
  cksfv
    module: 'explorer-cksfv'
```

### Development

[See plugins documentation](https://github.com/soyuka/explorer/blob/master/doc/Plugins.md)

## Development

Clone [see From git](#from-git)
The easiest is to compile with babel for ES6 compatibility:

```bash
DEBUG="explorer:*" babel-node index.js -c config.example.dev.yml
```

Sass is compiled with gulp: 

```bash
gulp watch
```

To get stack traces from errors use `dev: true` in your configuration file. 

### Tests

Tests are using their own configuration file `test/fixtures/config.yml`:

```bash
mocha --compilers js:babel/register
```

### Api docs

Generated with [apidocjs](http://apidocjs.com) ([available here](http://soyuka.github.io/explorer/#api-Admin-createUser)):

`apidoc -i routes -o doc/api`

## Performances

We use Bluebird with concurrency, for your information you may speed things up:

```
$ sync && echo 3 > /proc/sys/vm/drop_caches
$ node test.js 1
reading files 35ms
$ sync && echo 3 > /proc/sys/vm/drop_caches
$ node test.js Infinity
reading files: 9ms
```

See [bluebird docs](https://github.com/petkaantonov/bluebird/blob/master/API.md#option-concurrency), `tree.concurrency` and `search.concurrency` configuration options.

In the configuration there is a `tree.maxDepth` parameter. It's used when *estimating* the size of a directory, we'll stop recursivity when depth is more than 10. 
10 is a lot actually, to improve performances you should lower the number. To get a more precise number increase it.

The `search.maxDepth` indicates wether to search in the directory or not if it's too deep. Search will go faster but you'll get less results. 

## Why?

I did this because I could not find a light file explorer. It had to be simple, easy to install and fast. 
I tried [pydio](https://pyd.io) but it's heavy and long to install. I also tried [h5ai](http://larsjung.de/h5ai/) but it does not have user support and has a lot of client-side javascript. I also have the feeling that it's slow.
Explorer was built with [only 15 client javascript lines](https://github.com/soyuka/explorer/blob/master/views/index.haml#L60). It's fun to see how hard it seems, nowadays, to avoid using javascript for apps that don't require it. 

KISS.
