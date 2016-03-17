import {Injector, Component, DynamicComponentLoader, OnInit, ElementRef} from 'angular2/core'
import {AuthHttp} from 'angular2-jwt/angular2-jwt'

import {HooksService} from '../../services/hooks'
import {MessagesService} from '../../services/messages'
import {HookComponent} from './hook'
import {Tree} from '../../models/tree'

@Component({
  selector: 'action-hooks',
  templateUrl: 'templates/hooks/action.html',
  inputs: ['tree', 'paths']
})

export class ActionHooksComponent extends HookComponent implements OnInit {
  public action: string = 'archive.download'
  public filename: string = 'archive-' + Date.now()
  public paths: Array<string>

  public tree: Tree
  public scope: Object
  public hook: string = 'action'
  public id: string = 'action-hook'
  public root: boolean = true

  constructor(private loader: DynamicComponentLoader, private elementRef: ElementRef, private hooks: HooksService, private messages: MessagesService, private injector: Injector, private _http: AuthHttp) {
    super()
  }

  send() {
    if(this.action == 'archive.download') {
      return (<any>document.getElementById('tree-form')).submit()
    }

    this.hooks.action.post({action: this.action, filename: this.filename, path: this.paths})
    .subscribe(
      (resp) => {
        this.messages.info(resp)
        this.hooks.next(this.hook)
      },
      (err) => {
        this.messages.error(err) 
      }
    )
  }

  ngOnInit() {
    this.hooks.subscribe(hook => this.update())
    this.update() 
  }
}
