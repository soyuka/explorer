import mem from './memory.js'

function registerHooks(config, url, user) {
  return {
    action: function(tree) {
      let str = `
        <optgroup label="Copy">
          <option value="move.copy">Copy</option>
          <option value="move.cut">Cut</option>
        </optgroup>`

      return str
    },
    directory: function(tree) {
      
      let paths = mem.get(user.username)

      if(!paths || paths.length == 0)
        return ''

      let str = '<form method="POST" action="'+url+'"><select multiple>'

      for(var i in paths) {
        str += `<option value="${paths[i].method}-${paths[i].path}">${paths[i].path}</option>` 
      }

      str += '</select><input type="submit" value="paste"></form>'
    
      return str
    }
  }
}

export default registerHooks
