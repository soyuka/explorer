import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Headers} from 'angular2/http' 

export class Hook {
  headers: Headers
  name: string

  constructor(private _http: AuthHttp) {
    this.headers = new Headers()
    this.headers.append('Content-Type', 'application/json')
  }

  template() {
    return this._http.get('/api/hooks/' + this.name + '/template')
    .map(res => res.text())
  }
  
  scope() {
    return this._http.get('/api/hooks/' + this.name + '/scope')
    .map(res => res.json())
  }
}
