try {
  var config = require('yamljs').load('./config.yml')

  if(!config.search) {
    config.search = {} 
  } 
} catch(e) {
  console.log('No config file!')
  throw e
}

require('./server.js')(config)
.then(function(app) {
  return app.listen(config.port || 4859, e => console.log(config.port))
}) 
