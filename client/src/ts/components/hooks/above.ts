import {Injector, Component, DynamicComponentLoader, OnInit, ElementRef} from 'angular2/core'
import {AuthHttp} from 'angular2-jwt/angular2-jwt'

import {HooksService} from '../../services/hooks'
import {MessagesService} from '../../services/messages'
import {HookComponent} from './hook'
import {Tree} from '../../models/tree'
import {TreeOptions} from '../../models/treeOptions'

@Component({
  selector: 'above-hooks',
  templateUrl: 'templates/hooks/above.html',
  inputs: ['tree', 'options']
})

export class AboveHooksComponent extends HookComponent implements OnInit {
  public tree: Tree
  public options: TreeOptions
  public scope: Object
  public id: string = 'abovehook'
  public hook: string = 'above'

  constructor(private loader: DynamicComponentLoader, private elementRef: ElementRef, private hooks: HooksService, private messages: MessagesService, private injector: Injector, private _http: AuthHttp) {
    super()
  }

  ngOnInit() {
    this.hooks.subscribe(hook => this.update())
    this.update()
  }
}
