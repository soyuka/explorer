import {Component, Input, Output} from 'angular2/core'
import {RouterLink} from 'angular2/router'
import {NotificationsService} from 'services/notifications'
import {UserService} from 'services/user'
import {TokenService} from 'services/token'

import {AppComponent} from 'components/app'

@Component({
  templateUrl: 'templates/menu.html',
  selector: 'explorer-menu',
  directives: [RouterLink],
  providers: [NotificationsService, UserService, TokenService]
})

export class MenuComponent {
  constructor(public notifications: NotificationsService, private _user: UserService, public token: TokenService) {
  }

  @Input() open;

  get user() {
    return this._user.user
  }

  //logout click
  logout() {
    this._user.logout() 
    this.router.navigate(['Login'])
  }
}
