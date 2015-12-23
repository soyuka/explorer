import {View, Component, OnInit, DynamicComponentLoader, ElementRef} from 'angular2/core'
import {HooksService} from 'services/hooks'
import {ActionHook} from 'services/hooks/action'
import {TreeService} from 'services/tree'
import {MessagesService} from 'services/messages'

@Component({
  selector: 'action-hooks',
  templateUrl: 'templates/hooks/action.html',
  providers: [HooksService, TreeService, MessagesService, ActionHook],
  inputs: ['tree', 'paths']
})

export class ActionHooksComponent implements OnInit {
  private dynamicComponent

  public tree: Tree
  public action: string
  public filename: string
  public paths: array

  constructor(private loader: DynamicComponentLoader, private element: ElementRef, private hooks: HooksService, private treeService: TreeService, private messages: MessagesService) {
  }

  send() {
    if(this.action == 'archive.download') {
      return document.getElementById('tree-form').submit()
    }

    this.hooks.action.post({action: this.action, filename: this.filename, path: this.paths})
    .subscribe(
      (resp) => {
        this.messages.info(resp)
      },
      (err) => {
        this.messages.error(err) 
      }
    )
  }

  ngOnInit() {
    this.action = 'archive.download'
    this.filename = 'archive-' + Date.now()

    this.hooks.action.get()
    .subscribe(
      res => {
        this.loader.loadAsRoot(toComponent(res), '#action-hook')
        .then(componentRef => {
          componentRef.instance.tree = this.tree
          this.dynamicComponent = componentRef.instance
        })
      },
      err => this.messages.error(err)
    )
  }
}

function toComponent(template, directives = []) {
  @Component({ 
    selector: 'dynamic-component',
    template: template
  })

  class DynamicComponent {
    public tree: Tree
  }
  
  return DynamicComponent
}

