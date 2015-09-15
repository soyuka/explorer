## From 1.x to 2.x

Configuration must be updated, edit `~/.config/explorer/config.yml` and add the following:

```
remove: 
  # 'mv' will move files to a trash directory
  # 'rm' will delete files
  # empty to disable deletion
  method: 'mv' #default is to move
  path: './trash'
archive:
  path: './tmp'
upload:
  path: './upload'
  concurrency: 10
dev: false
```

### From < 2.0.6 to 2.0.7+

Package name changed and is no longer published to `directory-listings`.

```
pm2 uninstall directory-listings
pm2 install xplorer
```

Configuration will not be removed.
