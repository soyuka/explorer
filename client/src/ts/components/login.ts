import {Component} from 'angular2/core'
import {Http, Headers} from 'angular2/http' 
import {NgForm} from 'angular2/common'
import {User} from 'models/user'
import {tokenNotExpired} from 'angular2-jwt/angular2-jwt'
import {Router, Location, CanActivate} from 'angular2/router'
import {TokenService} from 'services/token'

@Component({
  templateUrl: 'templates/login.html'
})

@CanActivate(() => !tokenNotExpired())

export class LoginComponent {

  constructor(private http: Http, private router: Router, private location: Location, private token: TokenService){}

  error = null
  user = new User()

  onSubmit() {

    let headers = new Headers()
    headers.append('Content-Type', 'application/json')

    this.http.post('/login', JSON.stringify(this.user), {headers: headers})
    .map(res => res.json())
    .subscribe(
      data => {
        this.token.token = data.token
        this.location.replaceState('/')
        this.router.navigate(['Tree', {path: data.home}])
      },
      err => this.error = err
    )
  }
}
