import {Injectable} from 'angular2/core'
import {TokenService} from 'services/token'

@Injectable()
export class UserService {
  constructor(private _token: TokenService) {
  }

  get user() {
    return this._token.user
  }

  get token() {
    return this._token.token 
  }

  logout() {
    return this.http.get('/logout')
    .subscribe(() => this.token.remove())
  }
}
