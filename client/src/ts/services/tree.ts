import {AuthHttp} from 'angular2-jwt/angular2-jwt'
import {Injectable} from 'angular2/core'
import {Headers, URLSearchParams, RequestOptions} from 'angular2/http' 
import * as Rx from 'rxjs/Rx'

import {Tree} from '../models/tree'

@Injectable()
export class TreeService {
  private headers: Headers = new Headers()
  public tree: Tree
  private search = ''

  constructor(private _http: AuthHttp) {
    this.headers.append('Content-Type', 'application/json')
  }

  private optionsToURLSearchParams(options) {
    let search = new URLSearchParams()
    for(let i in options) {
      search.set(i, options[i])
    }
    return search
  }
    
  getItems(options: any) {
    let url = options.search ? 'search' : 'tree'
    options = this.optionsToURLSearchParams(options)
    return this._http.get(`/api/${url}?${options.toString()}`)
    .map(res => {
      return new Tree(res.json())
    })
  }

  list(options: Rx.Observable<Object>, debounceTime = 400) {
    return options
      .distinctUntilChanged()
      .debounce(function(options: any) {
        let debounce = false

        //new search
        if(options.search && options.search != this.search) {
          this.search = options.search
          if(options.page != 1)
            options.page = 1
          debounce = true
        }

        return Rx.Observable.timer(debounce ? debounceTime : 1)
      })
      .switchMap(options => this.getItems(options)) 
  }

  actionHook(data: string) {
    return this._http.post('/api/tree', JSON.stringify(data), {headers: this.headers}) 
  }
}
