# Directory Listings [![Build Status](https://travis-ci.org/soyuka/explorer.svg?branch=master)](https://travis-ci.org/soyuka/explorer)

Explore and share

![Screenshot](https://raw.githubusercontent.com/soyuka/explorer/master/screen.png)

## Requirements

- nodejs (> 0.11 with harmony support) 

### Installing nodejs with [nvm](https://github.com/creationix/nvm)

```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash
nvm install 0.12 #nvm ls-remote to see available versions
nvm alias default 0.12
```

## Install

Download, unpack, configure, launch :

```bash
curl -L https://github.com/soyuka/explorer/archive/v1.0.6.tar.gz | tar xz
cd explorer-1.0.6
cp config.example.yml config.yml #copy default configuration
cp users.default data/users #copy default database
npm rebuild
node --harmony index.js
```

Check `IP:4859`, login with `admin:admin`. Don't forget to change the password!

### Configuration

```yaml
---
search: 
  # Available: pt, ack, find, mdfind, custom, native
  method: 'custom' 
  # Custom search command (${search} will be replaced by the string) 
  command: "pt --nocolor --nogroup -l -i '${search}' ." # not used by native
  max_depth: 10 # Default 10
  concurrency: 100 # Default 100 (only used with native search)
  # String match score (only used with native search)
  maxScore: 0.5
pagination:
  # Maximum number of items per page
  limit: 10 # Default 100
# Be carefull with this next section as it will have an impact on performances
tree:
  # When calculating directory size we stop at the max_depth
  max_depth: 10 #Default 10
  concurrency: 100 #Default 100
database: './data/users' # don't touch if you don't know what you're doing
app_root: '/' # see below about nginx location
session_secret: 'Some string here' #change this
port: 4859
```

### Daemonize with pm2
```bash
npm i pm2 -g
pm2 start --node-args="--harmony" --name explorer index.js
```

With iojs you can run:
```
pm2 --next-gen-js --name explorer start index.js
```

Or with babel-node:

```
npm i pm2 babel-node -g
pm2 --interpreter babel-node --name explorer start index.js
```

### Nginx

```nginx
upstream directorylistings {
  server localhost:4859 #port can be changed in the config.yml
}

server {
  listen 80;

  location / { #if you want to change this, change `app_root` in the config.yml
    proxy_pass http://directorylistings/ 
  }
}
```

## Update

```
cd /path/to/your/explorer
curl -L https://github.com/soyuka/explorer/archive/v1.0.6.tar.gz | tar xz --strip-components 1
npm rebuild
```

## Tests

```bash
npm test
```

## Development

Must be compiled with babel for ES6 compatibility.

```bash
gulp watch #scss
DEBUG="explorer:*, explorer:routes:*" babel-node index.js
```

## Thoughts and improvements

I did this because I could not find a light file explorer. I tried pydio but it's heavy and long to install.
Features like in-place text editing, images viewer could be nice but they will add some significant overload.
An unarchiver could be a nice feature too but will require some dependencies (unrar, unzip).

KISS.
