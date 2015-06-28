# Directory Listings

Explore and share

![Screenshot](https://raw.githubusercontent.com/soyuka/explorer/master/screen.png)

## Requirements

- nodejs

## Install

Download, unpack, configure, launch :

```bash
curl -L https://github.com/soyuka/explorer/archive/v1.0.1.tar.gz | tar xz
cd explorer-1.0.1
cp config.example.yml config.yml #copy default configuration
cp users.default data/users #copy default database
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
pm2 ---next-gen-js start directory-listings/index.js
```

### Nginx

```nginx
upstream directorylistings {
  server localhost:4859 #port can be changed in the config.yml
}

server {
  listen 80;

  location / { #if you want to change this, change `app_route` in the config.yml
    proxy_pass http://directorylistings/ 
  }
}
```

## Tests

```bash
npm test
```

## Development

Must be compiled with babel for ES6 compat.

```bash
gulp watch #scss
DEBUG="explorer:*, explorer:routes:*" babel-node index.js
```
