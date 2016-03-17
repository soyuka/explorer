import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Injectable, EventEmitter} from 'angular2/core'
import {RequestOptionsArgs} from 'angular2/http'

import {ActionHook} from './hooks/action'
import {AboveHook} from './hooks/above'
import {MessagesService} from './messages'

@Injectable()
export class HooksService extends EventEmitter<any> {
  constructor(private _http: AuthHttp, public action: ActionHook, public above: AboveHook, private messages: MessagesService) {
    super()
  }

  http(method: string, url: string, options?: RequestOptionsArgs) {
    if(!method || !url)
      throw new TypeError('Method and url are required')

    method = method.toLowerCase()

    return this._http[method](url, options)
    .subscribe(
      info => {
        this.messages.info(info)
        this.next(null)
      }, 
      error => this.messages.error(error)
    )
  }
}
