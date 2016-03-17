import {Injectable} from 'angular2/core'
import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Headers} from 'angular2/http' 

@Injectable()
export class UsersService {
  private headers:Headers = new Headers()

  constructor(private http: AuthHttp) {
    this.headers.append('Content-Type', 'application/json')
  }

  remove(username) {
    return this.http.delete('/api/a/delete/'+username).map(res => res.json())
  }

  getList() {
    return this.http.get('/api/a/users').map(res => res.json())
  }

  get(username) {
    return this.http.get('/api/a/user/'+username).map(res => res.json())
  }

  update(user) {
    return this.http.put('/api/a/users', JSON.stringify(user), {headers: this.headers}) 
  }

  create(user) {
    return this.http.post('/api/a/users', JSON.stringify(user), {headers: this.headers}) 
  }
}
