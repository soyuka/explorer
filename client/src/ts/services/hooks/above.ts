import {Injectable} from 'angular2/core'
import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Hook} from './hook' 

@Injectable()
export class AboveHook extends Hook {
  constructor(private _http: AuthHttp) {
    super(_http)
  }

  public name: string = 'above'
}
