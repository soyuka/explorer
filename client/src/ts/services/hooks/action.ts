import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Injectable} from 'angular2/core'
import {Hook} from './hook' 

@Injectable()
export class ActionHook extends Hook {
  public name: string = 'action'
  constructor(private _http: AuthHttp) {
    super(_http)
  }

  post(data) {
    return this._http.post('/api/tree', JSON.stringify(data), {headers: this.headers}) 
  }
}
