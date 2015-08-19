## From 1.x to 2.x

Configuration must be updated, edit `~/.config/explorer/config.yml` and change the following:

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
