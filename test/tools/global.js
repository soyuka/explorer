var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

global.chai = chai
global.chaiAsPromised = chaiAsPromised

global.expect = require('chai').expect
global.bootstrap = require('./bootstrap.js')
global.Promise = require('bluebird')
