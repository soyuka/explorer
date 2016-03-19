function registerHooks(config) {

  function actionTemplate() {
    var str = ''+
      '<optgroup label="Zip">'+
        '<option value="archive.download" selected="selected">Download</option>'

    if(config.archive.disabled != true)
      str += '<option value="archive.compress">Archive</option>'

    str += '</optgroup>'

    return str
  }

  return {
    action: {
      template: actionTemplate()
    } 
  }
}

module.exports = registerHooks
