import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Injectable} from 'angular2/core'
import {Headers, URLSearchParams, RequestOptions} from 'angular2/http' 

@Injectable()
export class ActionHook {
  constructor(private _http: AuthHttp) {
    this.headers = new Headers()
    this.headers.append('Content-Type', 'application/json')
  }

  get() {
    return this._http.get('/api/hooks/action')
    .map(res => res.text())
  }

  post(data) {
    return this._http.post('/api/tree', JSON.stringify(data), {headers: this.headers}) 
  }
}
