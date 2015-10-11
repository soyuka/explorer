function registerHooks(config) {
  return {
    menu: function() {

      if(config.upload.disabled === true)
        return ''

      return '<li><a href="/p/upload"><i class="icon-upload"></i>Upload</a></li>'
    } 
  }
}

module.exports = registerHooks
