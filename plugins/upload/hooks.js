function registerHooks(config) {
  return {
    menu: function() {

      if(config.upload.disabled === true)
        return ''

      return '<li><a href="/upload"><i class="icon-upload"></i>Upload</a></li>'
    } 
  }
}

export default registerHooks
