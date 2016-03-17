import {Component} from 'angular2/core'
import {NgForm} from 'angular2/common'
import {tokenNotExpired} from 'angular2-jwt/angular2-jwt'
import {Router, Location, CanActivate} from 'angular2/router'

import {UserService} from '../services/user'
import {User} from '../models/user'

@Component({
  templateUrl: 'templates/login.html',
  providers: [UserService]
})

@CanActivate(() => !tokenNotExpired())

export class LoginComponent {

  constructor(private _router: Router, private _location: Location, private _user: UserService){}

  public error:String = null
  public user:User = new User()

  onSubmit() {
    this._user.login(this.user)
    .subscribe(data => {
       this._location.replaceState('/')
       this._router.navigate(['Tree', {path: ''}])
    }, err => this.error = err)
  }
}
