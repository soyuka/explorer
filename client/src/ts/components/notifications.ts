import {Component} from 'angular2/core'

import {NotificationsService} from '../services/notifications'

@Component({
  templateUrl: 'templates/notifications.html',
  selector: 'explorer-notifications'
})

export class NotificationsComponent {
  constructor(private _notifications: NotificationsService) {}

  get notifications() {
    return this._notifications.notifications
  }

  removeAll() {
    return this._notifications.removeAll() 
  }
}
