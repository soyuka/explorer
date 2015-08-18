import assert from 'assert'
import IPCEE from 'ipcee'

let ipc = IPCEE(process)
let debug = require('debug')('explorer:job')
let p = require('path')

let plugins = {}
let args = [].slice.call(process.argv, 2)

for(let i in args) {
  let title = p.basename(args[i], '.js')
  debug('Require %s', title)
  plugins[title] = require(args[i])(ipc)
}

ipc.on('command', function(args, ...data) {

  args = args.split('.')

  let command = args.shift()
  let option = args.shift()

  assert(command, 'Must have a "command" argument')
  assert(option, 'Must have an "option" argument')

  debug('Got command %s.%s with data %o', command, option, data)

  let job = plugins[command]

  if(!job) {
    return ipc.send('error', 'Command ' + command + ' is not available')
  }

  if(option !== undefined && option in job && typeof job[option] == 'function') {
    return job[option].apply(job, data)
  } 

  return ipc.send('error', 'Option ' + option + ' is not a valid option')
})

ipc.on('info', function(plugin = null) {

  if(plugin && !(plugin in plugins))
    return ipc.send('error', 'Plugin ' + plugin + ' is not available')

  let check = Object.keys(plugins)
  let data = {}

  if(plugin)
    check = [plugins]

  for(let i in check) {
    data[check[i]] = plugins[check[i]].info() 
  }

  return ipc.send('info', data)
})

ipc.on('clear', function(username) {

  let check = Object.keys(plugins)
  let data = {}

  for(let i in check) {
    data[check[i]] = plugins[check[i]].clear(username) 
  }

  return ipc.send('clear', data)
})


ipc.on('uncaughtException', function(err) {
  //Temptation would be to send the full Error object
  //but JSON.stringify(new Error('test')) will return '{}'
  ipc.send('error', err.toString(), err.stack)

  console.error(err.stack)

  process.nextTick(function() {
    process.exit(1) 
  })
})

ipc.send('job.start', Object.keys(plugins))
