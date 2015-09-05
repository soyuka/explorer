function registerHooks(locals, config) {
  return {
    action: function() {
      let str = `
        <optgroup label="Zip">
          <option value="archive.download" selected="selected">Download</option>`

      if(locals.archive.disabled != true)
        str += `<option value="archive.compress">Archive</option>`

      str += `</optgroup>`

      return str
    } 
  }
}

export default registerHooks
