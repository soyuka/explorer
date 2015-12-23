import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Injectable} from 'angular2/core'
import {TokenService} from 'services/token'

@Injectable()
export class NotificationsService {
  private timeout: number = 1650
  private _notifications = []
  public _num = 0

  constructor(private token: TokenService, private http: AuthHttp) {
    this.client = new Faye.Client(window.location.origin + '/socket', {timeout: this.timeout}) 

    //@TODO
    //http.get('/notif')

    this.client.addExtension({
      outgoing: function(message, callback) {
        message.ext = message.ext || {}
        message.ext.key = token.user.key
        return callback(message)
      } 
    })
    
    let notify = '/notify/'+this.token.user.username
    this.client.subscribe(notify, this.onNotifications)
  
    this.http.get('/api/notifications') 
    .map(res => res.json())
    .subscribe(response => {
      this._notifications = response.notifications
      this._num = response.num
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
  }

  public removeAll() {
    console.log(arguments);  
  }

  public remove(item) {
    console.log(arguments);  
  }
}
