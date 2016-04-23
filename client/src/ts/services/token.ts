import {JwtHelper} from 'angular2-jwt/angular2-jwt'
import {Injectable} from 'angular2/core'

@Injectable()
export class TokenService {
  constructor() {}

  private jwtHelper: JwtHelper = new JwtHelper()
  private userCache: any

  expired() {
    let token = localStorage.getItem('id_token')
    if(!token)
      return true

    return this.jwtHelper.isTokenExpired(token)
  }

  get token() {
    return localStorage.getItem('id_token') 
  }

  set token(token) {
    localStorage.setItem('id_token', token) 
  }

  remove() {
    return localStorage.removeItem('id_token') 
  }

  get user() {
    let token = localStorage.getItem('id_token')

    if(!token) {
      this.userCache = null
      return {} 
    }

    if(this.userCache)
      return this.userCache

    this.userCache = this.jwtHelper.decodeToken(token)

    return this.userCache
  }
}
