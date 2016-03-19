# Changelog

## 4.0.0
- new frontend with angular2
- BC break GET /tree result
- GET /logout => GET /api/logout
- /settings => /api/me
- BC break => plugins hooks

## 2.2.7-beta
- add binary to help installing plugins and reloading explorer
- refactor native search :
  - use tree lib instead of code duplication
  - implement search filters (--dir)
  - use Jaro Winkler distance
- improved plugins managment 
  - plugins are using a detached router on /p/pluginName
  - better hooks management
  - docs improvement ([see here](https://github.com/soyuka/explorer/blob/master/doc/Plugins.md))
- Main directory cleanup
  - moved configuration examples to `doc/examples`
  - default configuration is taken from `doc/example`
- refactor deployment/publish scripts

## 2.1.0-beta
- Plugins implementation
- Minor view fixes
- Docs and comments

## 2.0.11
- Improve docs
- Serve files if images or text instead of forcing download
- Tests improvements

## 2.0.10
- Fix directory archiving

## 2.0.8
- Better notifications
- Fix missing upload notification
- Max number of files to upload

## 2.0.7
- Rename npm package to `xplorer`
- Less fancy login

## 2.0.5
- Notify when something has started

## 2.0.4
- Configuration upload.maxSize

## 2.0.1
- Lots of new tests
- Remote-upload feature
- Archive and remote upload are done in background with notifications
- Better download/archive UI
- Better login UI
- Remove archive.keep configuration option
- ApiDoc (`npm run docs`)
- Logo \o/

## 1.2.1
- Fix issue while compressing and not keeping archives

## 1.2.0
- Trash directory by user (or global)
- Save archives in a temp directory by user (or globa)
- Better user managment through schema
- When archive saving is enabled, you can now skip downloading it
- Fix trash empty
- Ignore paths by user
- Read only mode
- Fix #1 #9 #8
- Better configuration management

## 1.1.4
- Add size sort (directory size calculated before pagination)

## 1.1.3
- remove `bower_components` static
- add order and sort cookie 

## 1.1.2
- Fix admin panel user creation/updates
- Fix security issues regarding the settings update (should be logged in anyway)
- Small fixes

## 1.1.0
- Remove feature
- HTTPS
- Small fixes
