import {Component, OnInit} from 'angular2/core'
import {ROUTER_DIRECTIVES, RouteConfig, Router, Location} from 'angular2/router'

import {TreeComponent} from './tree'
import {SettingsComponent} from './settings'
import {AdminComponent} from './admin'
import {LoginComponent} from './login'
import {NotificationsComponent} from './notifications'
import {MessagesComponent} from './messages'
import {MenuComponent} from './menu'

import {TokenService} from 'services/token'

@Component({
  selector: 'explorer-app',
  templateUrl: 'templates/app.html',
  directives: [ROUTER_DIRECTIVES, NotificationsComponent, MessagesComponent, MenuComponent],
  providers: [TokenService]
})

@RouteConfig([
  {path: '/:path', name: 'Tree', component: TreeComponent},
  {path: '/login', name: 'Login', component: LoginComponent},
  {path: '/settings', name: 'Settings', component: SettingsComponent},
  {path: '/admin', name: 'Admin', component: AdminComponent}
])

export class AppComponent implements OnInit {
  open = {left: false, right: false}

  constructor(private router: Router, private location: Location, private token: TokenService) {}

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
      this.token.expired() !== false || 
      this.router.isRouteActive(this.router.generate(['/Login']))
    ) {
      return
    }

    this.location.replaceState('/')
    this.router.navigate(['Login'])
  }
}
