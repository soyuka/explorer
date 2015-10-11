'use strict';
var minimist = require('minimist')
var debug = require('debug')('explorer:search:filters')

function Filters() {
  if(!this instanceof Filters) { return new Filters() }

  this.schema = {
    exact: {
      aliases: ['e'],
      filter: function(path, search) {
        return path.name == search 
      },
      continue: false,
      order: 99
    },
    dir: {
      aliases: ['d', 'directory'],
      filter: function(path, search) {
        return path.directory == true
      },
      order: 1
    }
  }

  for(let i in this.schema) {
    let e = this.schema[i]
    if('aliases' in e) {
      for(let j in e.aliases) {
        this.schema[e.aliases[j]] = e
      }
    }
  }
}

Filters.prototype.parse = function(search) {

  var filters = minimist(search.split(' ').map(function(e) { 
    //replaces -exact by --exact so that minimist parses them correctly
    if(/^-{1}[a-z]{2,}$/gi.test(e)) {
      e = e.replace('-', '--')
    } 
    return e
  }), {boolean: true})

  search = filters._.join(' ')
  delete filters._

  debug('filters %o', filters)
  debug('search %s', search)

  for(let i in this.schema) {
    let e = this.schema[i]

    if(i in filters) {
      filters[i] = e 
    }
  }

  this.filters = this.orderFilter(filters)
  
  return search
}

Filters.prototype.orderFilter = function(filters) {
  let temp = []
  let i = 0

  for(let j in filters) {
    temp[i] = filters[j]
    i++
  }

  return temp.sort((a, b) => a.order > b.order)
}

Filters.prototype.filter = function(path, search) {
  let result = null

  for(let i in this.filters) {
    let filter = this.filters[i]

    // debug('Running filter', filter)

    if(filter.continue === false) {
       result = filter.filter(path, search)
       // debug('Continue result %s', result)
       break;
    }

    let temp = filter.filter(path, search)

    if(temp === false) {
      result = false
      // debug('Falsy filter result')
      break;
    }
  }

  return result
}

module.exports = Filters
