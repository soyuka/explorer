function registerHooks(config, url, user) {
  return {
    menu: function() {

      if(config.upload.disabled === true)
        return ''

      return '<li><a href="'+url+'"><i class="icon-upload"></i>Upload</a></li>'
    } 
  }
}

module.exports = registerHooks
