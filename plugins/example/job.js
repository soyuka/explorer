/**
 * Job
 * @param IPCEE ipc our process communication instance
 **/
function Job() {
  if(!(this instanceof Job)) { return new Job() }
}

Job.prototype.setChannel = function(c) {
  this.channel = c
}

Job.prototype.create = function() {
    this.channel.send('archive:notify', 'admin', {message: `see in downloads`, path: './Downloads'})

    this.channel.send('decompress:notify', 'admin', {message: `see search`, path: './Downloads', search: '*.zip'})

    this.channel.send('upload:notify', 'admin', {message: `Error ERNAODJGAO ajog jo`, error: true})

    this.channel.send('move:notify', 'admin', {message: `
    Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
    tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At
    vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,
    no sea takimata sanctus est Lorem ipsum dolor sit amet.
  `})


    var self = this
    setTimeout(function() {
      self.channel.send('decompress:notify', 'admin', {message: `see path`, path: './Downloads'})
    }, 2000)

}

module.exports = Job
