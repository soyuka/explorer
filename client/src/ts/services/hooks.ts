import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Injectable} from 'angular2/core'
import {ActionHook} from 'services/hooks/action'

@Injectable()
export class HooksService {
  constructor(private _http: AuthHttp, public action: ActionHook) {}
}
