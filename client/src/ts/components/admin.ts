import {Component} from 'angular2/core'
import {Observable} from 'rxjs/Observable'
import {OnActivate, Router, RouterLink} from 'angular2/router'
import {AuthHttp} from 'angular2-jwt/angular2-jwt'

import {User} from '../models/user'
import {UsersService} from '../services/users'
import {MessagesService} from '../services/messages'

@Component({
  templateUrl: 'templates/admin.html',
  directives: [RouterLink],
  providers: [UsersService]
})

export class AdminComponent implements OnActivate {
  private configuration: any
  public trashSize: string
  public users: Array<User>

  constructor(private _users: UsersService, private _messages: MessagesService, private _http: AuthHttp, private _router: Router) {
    this.configuration = (<any>window).explorer_config 
  }

  /**
   * OnActivate get user list and the global trash size
   */
  routerOnActivate() {
    this._users.getList()
    .subscribe(users => {
      this.users = users
    }, err => this._messages.error(err))

    this._http.get('/api/a/trashSize')
    .map(res => res.json())
    .subscribe(trashSize => {
      this.trashSize = trashSize.trashSize
    }, err => this._messages.error(err))
  }

  /**
   * Empty trash
   */
  emptyTrash() {
    if(!confirm('Empty trash?'))
      return

    this._http.post('/api/a/trash', '')
    .map(res => res.json())
    .subscribe(info => this._messages.info(info), err => this._messages.error(err))
  }

  /**
   * Remove a user
   */
  remove(u) {
    if(!confirm('Delete ' + u.username  + '? ')) {
      return
    }

    this._users.remove(u.username)
    .subscribe(info => {
      this._messages.info(info)
      this.users.splice(this.users.indexOf(u), 1)
    }, err => this._messages.error(err))
  }
}
