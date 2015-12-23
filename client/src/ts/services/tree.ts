import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Injectable} from 'angular2/core'
import {Headers, URLSearchParams, RequestOptions} from 'angular2/http' 
import {Tree} from 'models/tree'
import * as Rx from 'rxjs/Rx'

@Injectable()
export class TreeService {
  private headers: Headers
  public tree: Tree
  private search = ''

  constructor(private _http: AuthHttp) {
    this.headers = new Headers()
    this.headers.append('Content-Type', 'application/json')
  }

  private optionsToURLSearchParams(options) {
    let search = new URLSearchParams()
    for(let i in options) {
      search.set(i, options[i])
    }
    return search
  }
    
  getItems(options) {
    let url = options.search ? 'search' : 'tree'
    options = this.optionsToURLSearchParams(options)
    return this._http.get(`/api/${url}?${options.toString()}`)
    .map(res => {
      return new Tree(res.json())
    })
  }

  list(options: Observable<Object>, debounceTime = 400) {
    return options
      .distinctUntilChanged()
      .debounce(function(x) {
        let debounce = false

        //new search
        if(x.search && x.search != this.search) {
          this.search = x.search
          if(x.page != 1)
            x.page = 1
          debounce = true
        }

        return Rx.Observable.timer(debounce ? debounceTime : 1)
      })
      .switchMap(options => this.getItems(options)) 
  }

  actionHook(data) {
    return this._http.post('/api/tree', JSON.stringify(data), {headers: this.headers}) 
  }
}
