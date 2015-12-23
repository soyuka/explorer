import {Component, ElementRef, Renderer} from 'angular2/core'
import {NotificationsService} from 'services/notifications'

@Component({
  templateUrl: 'templates/notifications.html',
  selector: 'explorer-notifications',
  providers: [NotificationsService]
})

export class NotificationsComponent {
  constructor(private el: ElementRef, private renderer: Renderer, public _notifications: NotificationsService) {}

  get notifications() {
    return this._notifications.notifications
  }

  open() {
    console.log(this.el);
  }
}
