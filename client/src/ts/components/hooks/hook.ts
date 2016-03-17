import {Injector, Component, DynamicComponentLoader, AfterContentInit, ElementRef} from 'angular2/core'
import {RequestMethod, RequestOptionsArgs} from 'angular2/http'
import {AuthHttp} from 'angular2-jwt/angular2-jwt'

import {HooksService} from '../../services/hooks'
import {MessagesService} from '../../services/messages'
import {Tree} from '../../models/tree'
import {TreeOptions} from '../../models/treeOptions'

/** abstract **/
export class HookComponent {
  tree: Tree
  options: TreeOptions
  scope: Object = {}
  hook: string
  id: string
  root: boolean = false

  dynamicComponent: any
  private loader: DynamicComponentLoader
  private elementRef: ElementRef
  private hooks: HooksService
  private messages: MessagesService
  private injector: Injector
  private _http: AuthHttp

  update() {
    this.hooks[this.hook].scope()
    .subscribe(
      scope => {
        if(!this.dynamicComponent) {
          return this.template(scope)
        }

        this.updateScope(scope)
      },
      err => this.messages.error(err)
    )
  }

  template(scope) {
    this.hooks[this.hook].template()
    .subscribe(
      res => this.loadComponent(res, scope),
      err => this.messages.error(err)
    )
  }

  updateScope(scope) {
    for(let i in scope)
      this.dynamicComponent[i] = scope[i]

    this.dynamicComponent.options = this.options
    this.dynamicComponent.tree = this.tree
  }

  loadComponent(template, scope) {
    let childComponent = toComponent(template)
    let load
    
    if(this.root === false) {
      load = this.loader.loadIntoLocation(childComponent, this.elementRef, this.id)
    } else {
      //loadAsRoot is used to append <option> to a <select>
      //can't be next to the node, must be Inside
      load = this.loader.loadAsRoot(childComponent, '#'+this.id, this.injector)
    }

    load
    .then(componentRef => {
      this.dynamicComponent = componentRef.instance

      this.updateScope(scope)
    })
  }
}

function toComponent(template, directives = []) {
  @Component({ 
    selector: 'dynamic-component',
    template: template,
    directives: directives
  })

  class DynamicComponent {
    public model: Object = {}
    public options: TreeOptions
    public tree: Tree

    constructor(private hooks: HooksService) {
    }

    http() {
      this.hooks.http.apply(this.hooks, arguments) 
    }

  }
  
  return DynamicComponent
}
