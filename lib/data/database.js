'use strict';
var Promise = require('bluebird')
var eol = require('os').EOL
var fs = Promise.promisifyAll(require('fs'))
var debug = require('debug')('explorer:data:database')

function Database(schema, object, options) {

  if(!this instanceof Database) { return new Database(schema, object, options) }

  if(!schema || !object) {
    throw new TypeError("Database expects a schema and an object");
  }

  options = options || {} 

  this.separator = ':'
  this.database = options.database
  this.schema = schema
  this.object = object
}


/**
 * Load database from file
 * @return Promise
 */
Database.prototype.load = function load() {
  var self = this

  return this.parse()  
  .then(function(data) {
    self.data = data 
    return Promise.resolve()
  })
  .catch(function(e) {
    console.error('Can not load database')
    return Promise.reject(e)
  })
}

/**
 * Parse the database
 * @return Promise
 */
Database.prototype.parse = function parse() {
  var self = this
  return fs.readFileAsync(this.database, {encoding: 'utf-8'}) 
  .then(function(db) {
   
    db = db.split(eol).filter(v => v.length > 0)

    var promises = db.map(e => e.split(self.separator))
    .map(function(e) {
      var u = {};
      for(let i in self.schema) {

        if(self.schema[i].index === true) {
          self.index = i 
        }

        u[i] = e[self.schema[i].position] 

        if(u[i] === undefined)
          u[i] = self.schema[i].default 

        if(self.schema[i].type == 'boolean') {
          u[i] = u[i] === '1' ? true : false 
        } else if (self.schema[i].type == 'buffer') {
          u[i] = new Buffer(u[i], 'base64').toString('ascii')
        }
      } 
      
      return new self.object(u, false)
    })

    return Promise.all(promises)
 })
}

/**
 * Writes the database
 * @return Promise
 */
Database.prototype.write = function write() {
  var str = []

  for(let i of this.data) {
    i && str.push(i.toString())
  }

  return fs.writeFileAsync(this.database, str.join(eol))
}

/**
 * Deletes a user by index
 * @param string index
 * @return Promise
 */
Database.prototype.remove = Database.prototype.delete = function del(index) {
  var u = this.data.findIndex(e => e[this.index] == index)

  if(!~u) {
    return Promise.reject(`Element ${index} not found`)
  }

  this.data.splice(u, 1)

  return this.write()
}

/**
 * Put an object to the file
 * @param string index
 * @return Promise
 */
Database.prototype.put = function put(data) {

  if(!(data instanceof this.object))
    throw new TypeError(`Not a ${this.object.constructor.name} instance`)

  var u = this.data.findIndex(e => e[this.index] == data[this.index])

  if(~u) {
    debug('update object %s, %s', data[this.index], data)
    this.data[u] = data
  } else {
    debug('object created %s', data)
    this.data.push(data) 
  }

  return this.write()
}

/**
 * Gets an object by index
 * @param string index
 * @return Object
 */
Database.prototype.get = function get(index) {
  return this.data.find(u => u[this.index] == index)
}


module.exports = Database
