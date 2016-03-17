import {Component} from 'angular2/core'
import {Observable} from 'rxjs/Observable'
import {OnActivate, RouteParams, Router} from 'angular2/router'

import {UsersService} from '../../services/users'
import {User} from '../../models/user'
import {MessagesService} from '../../services/messages'

@Component({
  templateUrl: 'templates/admin/user.html',
  providers: [UsersService],
  inputs: ['user']
})

export class AdminUserComponent implements OnActivate {

  public user: User
  private configuration = {}
  public create = false

  constructor(private _users: UsersService, private _messages: MessagesService, private _routeParams: RouteParams, private _router: Router) {
    this.configuration = (<any>window).explorer_config 
  }

  /**
   * On activate get user by username
   * if no username provided, it's a user creation
   */
  routerOnActivate() {
    let username = this._routeParams.get('username')

    if(!username) {
      this.create = true 
      return
    }

    this._users.get(username)
    .subscribe(user => {
      if(this.create === false)
        user.key = false

      user.admin = !!user.admin
      user.readonly = !!user.readonly

      this.user = user

    }, err => this._messages.error(err))
  }

  /**
   * Update user and redirect
   */
  update() {
    if(this.user.key === true)
      this.user.key = 1

    this._users[this.create ? 'create' : 'update'](this.user)
    .subscribe(info => {
      this._router.navigate(['Admin'])
      .then(() => this._messages.info(info))
    }, err => this._messages.error(err))
  }
}
