import {Injectable} from 'angular2/core'
import {Response} from 'angular2/http'

var errors = []
var infos = []

@Injectable()
export class MessagesService {
  private timeout: number = 2275
  public infos: Array<Object>
  public errors: Array<Object>

  constructor() {
    this.infos = infos
    this.errors = errors
  }

  private handle(item, scope) {
    if(item instanceof Response) {
      item = item.json()
    }

    this[scope].push(item)

    setTimeout(() => this.remove(item, scope), this.timeout)
  }

  public hasMessages() {
    return infos && infos.length || errors && errors.length 
  }

  public error(err) {
    console.error(err)
    return this.handle(err, 'errors')
  }

  public info(info) {
    return this.handle(info, 'infos')
  }

  public notification(notification) {
    if(notification.error) 
      return this.error({error: notification.message})

    return this.info({info: notification.message})
  }

  private remove(item, scope) {
    let index = this[scope].indexOf(item)

    if(~index)
      this[scope].splice(index, 1)
  }

  public removeError(err) {
    return this.remove(err, 'errors')
  }

  public removeInfo(info) {
    return this.remove(info, 'infos')
  }
}
