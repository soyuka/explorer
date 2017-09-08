'use strict';
var minimist = require('minimist')
var debug = require('debug')('explorer:search:filters')
var util = require('util')
var moment = require('moment')

function stringToDateFilter(str, key) {
  let match = str.match(/^([0-9]{1,})(\w+)$/)
  let m, prefix

  if(!match) {
    prefix = str.match(/^(<|>)/)

    if(prefix) {
      prefix = prefix[1] 
      str = str.replace(prefix, '')
    }

    try {
      m = moment(str)
    } catch(e) {}

    if(!m || !m.isValid())
      return false
  } else {
    prefix = '>'
    m = moment().subtract(match[1], match[2])
  }

  return function(path, search) {
    let d = moment(path[key])
    if(!prefix)
      return d.isSame(m, 'day')
    else {
      return prefix == '<' ? d.isBefore(m) : d.isAfter(m)
    }
  }
}

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
        return path.directory === true
      },
      order: -1
    },
    file: {
      aliases: ['f', 'file'],
      filter: function(path, search) {
        return path.directory !== true
      },
      order: -1
    },
    video: {
      filter: function(path, search) {
        return path.type == 'video' 
      },
      order: 2
    },
    audio: {
      filter: function(path, search) {
        return path.type == 'audio' 
      },
      order: 2
    },
    mtime: {
      set value(str) {
        let f = stringToDateFilter(str, 'mtime')

        if(typeof f == 'function') 
          this.filter = f

        return str
      },
      filter: function(path, search) {
        return true
      }
    },
    atime: {
      set value(str) {
        let f = stringToDateFilter(str, 'atime')

        if(typeof f == 'function') 
          this.filter = f

        return str
      },
      filter: function(path, search) {
        return true
      }
    },
    ctime: {
      set value(str) {
        let f = stringToDateFilter(str, 'ctime')

        if(typeof f == 'function') 
          this.filter = f

        return str
      },
      filter: function(path, search) {
        return true
      }
    },
    recursive: {
      aliases: ['r'],
      value: true
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

  let temp = [], j = 0

  for(let i in this.schema) {
    let e = this.schema[i]

    if(i in filters) {

      if(!Array.isArray(filters[i]))
        filters[i] = [filters[i]]

      for(let k in filters[i]) {
        let f = e
        f.name = i

        if(!f.order) {
          f.order = j
        }

        if(typeof filters[i][k] !== true) {
          f.value = filters[i][k]
        }

        temp[j] = util._extend({}, f)

        j++
      }
    }
  }

  this.filters = temp.sort((a, b) => a.order - b.order)

  debug('Computed filters', this.filters)
  
  return search
}

Filters.prototype.filter = function(path, search) {
  let result = null

  for(let i in this.filters) {
    let filter = this.filters[i]

    if(!filter.filter)
      continue;

    if(filter.continue === false) {
       result = filter.filter(path, search)
       break;
    }

    let temp = filter.filter(path, search)

    if(temp === false) {
      result = false
      break;
    }
  }

  return result
}

module.exports = Filters
