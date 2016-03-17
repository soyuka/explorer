import {Injectable} from 'angular2/core'
import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Http, Headers} from 'angular2/http' 

import {User} from '../models/user'
import {TokenService} from '../services/token'

@Injectable()
export class UserService {

  private headers:Headers = new Headers()

  constructor(private _token: TokenService, private authHttp: AuthHttp, private http: Http) {
    this.headers.append('Content-Type', 'application/json')
  }

  get user() {
    return this._token.user
  }

  get token() {
    return this._token.token 
  }

  update(user:User) {
    return this.authHttp.put('/api/settings', JSON.stringify(user), {headers: this.headers})
    .map(res => res.json())
  }

  logout() {
    return this.authHttp.get('/api/logout')
    .map(res => {
      this._token.remove()
      return res.json() 
    })
  }

  login(user:User) {
    return this.http.post('/login', JSON.stringify(user), {headers: this.headers})
    .map(res => {
      let data = res.json()
      this._token.token = data.token
      return res
    })
  }

  me() {
    return this.authHttp.get('/api/me', {headers: this.headers})
    .map(res => res.json())
  }
}
