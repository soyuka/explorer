import {Injector} from 'angular2/core'
import {TokenService} from './token'
import {it, expect, describe, beforeEach, afterEach} from 'angular2/testing'

export function main() {
  describe('TokenService', () => {
    var tokenService: TokenService
    var injector: Injector
    var content = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaG9tZSI6Ii9Vc2Vycy9zb3l1a2EvZXhwbG9yZXIvdGVzdC9maXh0dXJlcy90cmVlIiwia2V5IjoiZXk5eUtHcVZtTnkzUlZLOVpiQ2hVV2dSRiIsImFkbWluIjoxLCJyZWFkb25seSI6MCwiaWdub3JlIjoiIiwidHJhc2giOiIiLCJhcmNoaXZlIjoiIiwidXBsb2FkIjoiIiwiaWF0IjoxNDU3NTUwNTEyfQ.aRlS4BwFKeVmCBqiOQMl2z9NVWyRD9xl5nkKFQkp68s'

    beforeEach(() => {
      localStorage.setItem('id_token', content)
      injector = Injector.resolveAndCreate([TokenService])
      tokenService = injector.get(TokenService)
    })

    afterEach(() => localStorage.removeItem('id_token'))

    it('should get token', () => {
      expect(tokenService.token).toBe(content)
    })

    it('should set token', () => {
      tokenService.token = 'foobar'
      expect(tokenService.token).toBe('foobar')
      tokenService.token = content
    })

    it('should be a valid token', () => {
      expect(tokenService.expired()).toBe(false)
    })

    it('should get user from token', () => {
      let user = tokenService.user
      expect(user).not.toBe(null)
      expect(typeof user).toBe('object')
      expect(user.username).toBe('admin')
      expect(user.password).toBeUndefined()
      expect(tokenService.user).toEqual(user)
    })

    it('should remove valid token', () => {
      tokenService.remove()
      expect(tokenService.token).toBe(null)
      expect(tokenService.expired()).toBe(true)
      expect(Object.keys(tokenService.user).length).toBe(0)
    })

  })

}
