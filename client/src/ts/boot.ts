import 'rxjs/add/operator/map'
import 'rxjs/add/operator/debounceTime'
import 'rxjs/add/operator/debounce'
import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/do'
import 'rxjs/add/operator/delay'

import {bootstrap} from 'angular2/platform/browser'
import {provide} from 'angular2/core'
import {AppComponent} from './components/app'
import {APP_BASE_HREF, ROUTER_PROVIDERS, LocationStrategy, PathLocationStrategy} from 'angular2/router'
import {HTTP_PROVIDERS, BaseResponseOptions, ResponseOptions, RequestOptions, RequestMethod} from 'angular2/http'
import {AuthHttp, AuthConfig} from 'angular2-jwt/angular2-jwt'

bootstrap(AppComponent, [
  HTTP_PROVIDERS,
  provide(AuthConfig, { useFactory: () => new AuthConfig() }),
  AuthHttp,
  ROUTER_PROVIDERS,
  provide(APP_BASE_HREF, {useValue: window.location.origin})
])
.catch(err => console.error(err))
