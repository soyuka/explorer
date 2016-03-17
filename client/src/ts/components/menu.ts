import {Component, OnInit, Input} from 'angular2/core'
import {Router, RouterLink} from 'angular2/router'

import {NotificationsService} from '../services/notifications'
import {UserService} from '../services/user'

@Component({
  templateUrl: 'templates/menu.html',
  selector: 'explorer-menu',
  directives: [RouterLink],
  providers: [UserService]
})

export class MenuComponent {
  constructor(private _notifications: NotificationsService, private _user: UserService, private _router: Router) {
  }

  @Input() open;

  get user() {
    return this._user.user
  }

  get num() {
    return this._notifications.num
  }

  //logout click
  logout() {
    this._user.logout() 
    .subscribe(() => {
      this._router.navigate(['Login'])
    })
  }

  ngOnInit() {
    this._notifications.get() 
  }
}
