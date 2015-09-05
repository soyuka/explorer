function registerHooks(locals, config) {
  return {
    menu: function() {

      if(locals.archive.disabled === true)
        return ''

      return '<li><a href="/upload"><i class="icon-upload"></i>Upload</a></li>'
    } 
  }
}

export default registerHooks
