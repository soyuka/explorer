import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Injectable} from 'angular2/core'

import {TokenService} from './token'
import {MessagesService} from './messages'
import * as Faye from 'faye'

@Injectable()
export class NotificationsService {
  private timeout: number = 1650
  public _notifications: Array<Object> = []
  public _num: number = 0
  private client: any

  constructor(private token: TokenService, private http: AuthHttp, private messages: MessagesService) {
  }

  public get() {
    this.http.get('/api/notifications') 
    .map(res => res.json())
    .subscribe(response => {
      this._notifications = response.notifications
      this._num = response.num
    }, error => this.messages.error(error), () => this.connect())
  }

  private connect() {
    this.client = new Faye.Client(window.location.origin + '/socket', {timeout: this.timeout}) 

    let notify = '/notify/'+this.token.user.username
    let key = this.token.user.key

    this.client.subscribe(notify, data => this.onNotifications(data))

    this.client.addExtension({
      outgoing: function(message, callback) {
        message.ext = message.ext || {}
        message.ext.key = key
        return callback(message)
      } 
    })
    
  }

  get notifications() {
    return this._notifications
  }

  get num() {
    return this._num
  }

  private onNotifications(data) {
    this._notifications.push(data)
    this._num++
      console.log(data);
    this.messages.info(data)
  }

  public removeAll() {
    this.http.delete('/api/notifications') 
    .map(res => res.json())
    .subscribe(response => {
      console.log(response);
      this._num = 0
      this._notifications = []
    }, error => this.messages.error(error))
  }

  public remove(item) {
    console.log(arguments);  
  }
}
