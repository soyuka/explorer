import {Component, OnInit} from 'angular2/core'
import {ROUTER_DIRECTIVES, RouteConfig, Router, Location} from 'angular2/router'

import {TreeComponent} from './tree'
import {SettingsComponent} from './settings'
import {AdminComponent} from './admin'
import {LoginComponent} from './login'
import {NotificationsComponent} from './notifications'
import {MessagesComponent} from './messages'
import {MenuComponent} from './menu'
import {AdminUserComponent} from './admin/user'

import {TokenService} from '../services/token'
import {NotificationsService} from '../services/notifications'
import {MessagesService} from '../services/messages'
import {ActionHook} from '../services/hooks/action'
import {AboveHook} from '../services/hooks/above'
import {HooksService} from '../services/hooks'

@Component({
  selector: 'explorer-app',
  templateUrl: 'templates/app.html',
  directives: [ROUTER_DIRECTIVES, NotificationsComponent, MessagesComponent, MenuComponent],
  providers: [],
  viewProviders: [
    NotificationsService, TokenService, MessagesService, ActionHook, AboveHook, HooksService
  ]
})

@RouteConfig([
  {path: '/:path', name: 'Tree', component: TreeComponent},
  {path: '/login', name: 'Login', component: LoginComponent},
  {path: '/settings', name: 'Settings', component: SettingsComponent},
  {path: '/admin', name: 'Admin', component: AdminComponent},
  {path: '/admin/user', name: 'AdminUserCreate', component: AdminUserComponent},
  {path: '/admin/user/:username', name: 'AdminUserUpdate', component: AdminUserComponent}
])

export class AppComponent implements OnInit {
  open = {left: false, right: false}

  constructor(private _router: Router, private _location: Location, public token: TokenService) {}

  inNav(el) {
    let node = el.parentNode

    while(node != null) {
      if(node.tagName === 'NAV')
        return true

      node = node.parentNode
    }

    return false
  }

  close($event) {
    if(this.inNav($event.target)) {
      return 
    }

    this.open.left = false 
    this.open.right = false 
  }

  ngOnInit() {
    if(
      !this.token.expired() || 
      this._router.isRouteActive(this._router.generate(['/Login']))
    ) {
      return
    }

    this._location.replaceState('/')
    this._router.navigate(['Login'])
  }
}
