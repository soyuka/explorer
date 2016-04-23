import {Injector, provide} from 'angular2/core'
import {it, expect, describe, beforeEach, afterEach} from 'angular2/testing'

import {AuthHttp, AuthConfig} from 'angular2-jwt/angular2-jwt'
import {MockBackend, MockConnection} from 'angular2/src/http/backends/mock_backend';
import {Http, Headers, BaseRequestOptions, ConnectionBackend} from 'angular2/http' 

import {User} from '../models/user'
import {TokenService} from './token'
import {UserService} from './user'

export function main() {
  describe('UserService', () => {
    var injector: Injector
    var tokenService: TokenService
    var authHttp: AuthHttp
    var http: Http
    var userService: UserService
    var content = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaG9tZSI6Ii9Vc2Vycy9zb3l1a2EvZXhwbG9yZXIvdGVzdC9maXh0dXJlcy90cmVlIiwia2V5IjoiZXk5eUtHcVZtTnkzUlZLOVpiQ2hVV2dSRiIsImFkbWluIjoxLCJyZWFkb25seSI6MCwiaWdub3JlIjoiIiwidHJhc2giOiIiLCJhcmNoaXZlIjoiIiwidXBsb2FkIjoiIiwiaWF0IjoxNDU3NTUwNTEyfQ.aRlS4BwFKeVmCBqiOQMl2z9NVWyRD9xl5nkKFQkp68s'

    beforeEach(() => {
      localStorage.setItem('id_token', content)
      injector = Injector.resolveAndCreate([
        BaseRequestOptions,
        MockBackend,
        provide(Http, {
          useFactory: function(backend: ConnectionBackend, defaultOptions: BaseRequestOptions)  {
            return new Http(backend, defaultOptions)
          },
          deps: [MockBackend, BaseRequestOptions]
        }),
        TokenService,
        provide(AuthConfig, {
          useFactory: () => new AuthConfig() 
        }), 
        AuthHttp,
        UserService
      ])

      tokenService = injector.get(TokenService)
      authHttp = injector.get(AuthHttp)
      http = injector.get(Http)
      userService = injector.get(UserService)
    })

    afterEach(() => localStorage.removeItem('id_token'))

    it('should have json headers', () => {
      expect(userService.headers instanceof Headers).toBe(true)
      expect(userService.headers.has('Content-Type')).toBe(true)
    })

    it('should get token aliases', () => {
      expect(userService.user).toEqual(tokenService.user)
      expect(userService.token).toEqual(tokenService.token)
    })

  })

}
