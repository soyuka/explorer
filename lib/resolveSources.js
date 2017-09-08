var tree = require('./tree.js')
var p = require('path')
var Promise = require('bluebird')

/**
 * Get an array of file paths, explore directories recursively
 * This is useful to get clean sources for gulp, with a base
 * @param {Object} sources {files: [], directories: []}
 * @param {Object} options {root: ''}
 * @return {Array} [{paths: [], base: ''}, ...]
 */
function resolveSources(sources, options) {
  const treeOpts = {
    recursive: true, 
    maxDepth: Infinity, 
    limit: Infinity, 
    root: options.root
  }

  return Promise.join(
    function(files) {
      return files.map(function(file) {
        return {
          paths: [file],
          base: p.dirname(file)
        }
      })
    }(sources.files),
    function(directories) {
      return Promise.map(directories, function(dir) {
        return tree(dir, treeOpts)
        .then(function(tree) {
          return {
            paths: tree.tree
                  .filter(e => e.directory !== true)
                  .map(f => f.path),
            base: p.dirname(dir)
          }
        })
      })
    }(sources.directories)
  ).then(function(files, directories) {
    return [].concat.apply([], files, directories) 
  })
}

module.exports = resolveSources
