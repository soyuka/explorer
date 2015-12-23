import {Injectable} from 'angular2/core'
import {Response} from 'angular2/http'

var errors = []
var infos = []

@Injectable()
export class MessagesService {
  private timeout = 1650

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
    return this.handle(err, 'errors')
  }

  public info(info) {
    return this.handle(info, 'infos')
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
