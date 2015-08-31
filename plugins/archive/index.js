import Stat from '../job/stat.js'

let stat = new Stat('archive')

Archive.prototype.template = function(locals) {
  let treeAction = function() {
    let str = '<optgroupt label="zip">'
        str += '<option value="download" selected="selected">Download</option>'

    if(locals.archive.disabled !== true) {
      str += '<option value="archive">Archive</option>'
    }

    return str
  }

  let treeItem = function(item) {
    return '' 
  }

  return { treeAction, treeItem }
}

Archive.prototype.info = function() {
  return stat.get()
}

Archive.prototype.clear = function(user) {
  return stat.remove(user)
}

Archive.prototype.job = function() {
  return p.join(__dirname, './job.js')
}

Archive.prototype.config = function() {
  return {
    path: './temp'
  }
}

export default Archive
