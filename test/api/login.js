'use strict';
describe('login', function() {
  before(bootstrap.autoAgent)
  it('should login', bootstrap.login)
  it('should logout', bootstrap.logout)
}) 
