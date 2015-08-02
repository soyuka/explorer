
import Download from 'download'
import fs from 'fs'

  // new Download()
  // .get('https://mega.co.nz/#!eM1k3DzQ!0p8uu1AkOPk96uVikaCktA7ifdRfBnKWKHUyuauV-Dw')
  // .dest('tmp')
  // .run(function(e) {
  //   if(e) throw e
  // })

function Upload(ipc) {
  if(!(this instanceof Upload)) { return new Upload(ipc) }
  this.ipc = ipc
}

Upload.prototype.info = function() {
  return null
}

export default Upload
