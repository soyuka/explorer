import {Component} from 'angular2/core'
import {OnActivate} from 'angular2/router'

import {UserService} from '../services/user'
import {User} from '../models/user'
import {MessagesService} from '../services/messages'

@Component({
  templateUrl: 'templates/settings.html',
  providers: [UserService]
})

export class SettingsComponent implements OnActivate {
  public user: User
  private configuration: Object
  public key: boolean = false //boolean for checkbox

  constructor(private _user: UserService, private _messages: MessagesService) {
    this.configuration = (<any>window).explorer_config 
  }

  save() {
    console.log(this.key);
    if(this.key === true)
      this.user.key = 1

    this._user.update(this.user)
    .subscribe(info => {
      this.key = false
      this.user = info.user
      this._messages.info(info)
    }, err => this._messages.error(err))
  }

  /**
   * OnActivate get user list and the global trash size
   */
  routerOnActivate() {
    this._user.me()
    .subscribe(user => this.user = user, err => this._messages.error(err))
  }
}
