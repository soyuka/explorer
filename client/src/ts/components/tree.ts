import {Observable} from 'rxjs/Observable'
import {Component, OnInit} from 'angular2/core'
import {CanActivate, OnActivate, RouterLink, RouteParams, Router, Location} from 'angular2/router'
import {tokenNotExpired} from 'angular2-jwt/angular2-jwt'
import {Control, ControlGroup, FormBuilder} from 'angular2/common'

import {TreeService} from 'services/tree'
import {TokenService} from 'services/token'
import {UserService} from 'services/user'
import {extend} from 'utils/utils'
import {Tree} from 'models/tree'
import {TreeOptions} from 'models/treeOptions'
import {ActionHooksComponent} from 'components/hooks/action'
import {Get} from 'pipes/get'

@Component({
  templateUrl: 'templates/tree.html',
  providers: [TreeService, UserService],
  directives: [RouterLink, ActionHooksComponent],
  pipes: [Get]
})

@CanActivate(() => tokenNotExpired())

export class TreeComponent implements OnInit {
  private breadcrumb: Array = []
  private pages: Array = []
  private options: TreeOptions = new TreeOptions()
  private sortOptions = ['name', 'time', 'atime', 'size']
  private storageOptions: Object 
  public params = {
    search: [''],
    page: [1],
    sort: ['name'],
    order: ['asc'],
    limit: ['10'],
    path: ['/']
  }

  public paths = []

  public tree: Observable<Array<Object>>
  public term = new Control()

  public treeForm: ControlGroup

  constructor(private treeService: TreeService, private _user: UserService, private routeParams: RouteParams, private router: Router, private location: Location, builder: FormBuilder) {

    this.treeForm = builder.group(this.params)

    this.tree = treeService.list(this.treeForm.valueChanges)
    .do(tree => this.onUpdate(tree))
  }

  get user() {
    return this._user.user 
  }

  /**
   * Bind data to the view when request ends
   */
  onUpdate(tree: Tree) {
    this.breadcrumb = tree.breadcrumb
    this.pages = tree.pages
    this.storageOptions = this.treeForm.value
    let instruction = this.router.generate(['Tree', this.treeForm.value])

    let home = this.location.normalize(this.user.home)
    let path = instruction.toUrlPath().replace(home, '')

    this.location.go(path, instruction.toUrlQuery())
    this.options = tree.options
  }

  /**
   * Workaround as radio inputs are not implemented yet
   */
  setOrderValue(v) {
    this.treeForm.controls.order.updateValue(v)
  }

  /**
   * onLoad
   * why the hack on setTimeout?
   */
  ngOnInit() {
    setTimeout(() => {
      let params = this.routeParams.params
      let options = this.storageOptions

      for(let i in this.options) {
        if(i in params) {
          this.options[i] = params[i]
        } else {
          this.options[i] = this.storageOptions[i]
        }
      }
        
    })
  }

  /**
   * Checkbox onChange
   */
  checkElement(event) {
    let v = event.srcElement.value
    let index = this.paths.indexOf(v)

    if(!~index) {
      this.paths.push(v) 
    } else {
      this.paths.splice(index, 1) 
    }
  }

  get storageOptions() {
    let opts = localStorage.getItem('tree_options')
    if(!opts)
      return {}

    opts = JSON.parse(opts)
    opts.search = ''
    return opts
  }

  set storageOptions(opts) {
    let o = {}
    for(let i in opts) { o = opts[i] }
    delete o.search
    return localStorage.setItem('tree_options', JSON.stringify(opts))
  }

  navigate(options) {

    let controls = this.treeForm.controls

    for(let i in options) {
      if(i in controls && controls[i].value != options[i]) {
        controls[i].updateValue(options[i])
      }
    }
  }
}
