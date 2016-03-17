import {Observable} from 'rxjs/Observable'
import {Component, OnInit} from 'angular2/core'
import {CanActivate, RouterLink, RouteParams, Router, Location} from 'angular2/router'
import {tokenNotExpired} from 'angular2-jwt/angular2-jwt'
import {Control, ControlGroup, FormBuilder} from 'angular2/common'

import {TreeService} from '../services/tree'
import {TokenService} from '../services/token'
import {UserService} from '../services/user'
import {extend} from '../utils/utils'
import {Tree} from '../models/tree'
import {TreeOptions} from '../models/treeOptions'
import {ActionHooksComponent} from './hooks/action'
import {AboveHooksComponent} from './hooks/above'
import {Get} from '../pipes/get'

@Component({
  templateUrl: 'templates/tree.html',
  providers: [TreeService, UserService],
  directives: [RouterLink, ActionHooksComponent, AboveHooksComponent],
  pipes: [Get]
})

@CanActivate(() => tokenNotExpired())

export class TreeComponent implements OnInit {
  breadcrumb: Array<string> = []
  pages: Array<number> = []
  options: TreeOptions = new TreeOptions()
  sortOptions = ['name', 'time', 'atime', 'size']
  params = {
    search: [''],
    page: [1],
    sort: ['name'],
    order: ['asc'],
    limit: [10],
    path: ['/']
  }

  paths = []

  tree: Observable<Array<Object>>

  treeForm: ControlGroup

  constructor(private _treeService: TreeService, private _user: UserService, private _routeParams: RouteParams, private _router: Router, private _location: Location, private _builder: FormBuilder) {

    //build a form group, the form Observable triggers the treeService.list
    this.treeForm = _builder.group(this.params)

    //do the magic
    this.tree = _treeService.list(this.treeForm.valueChanges)
    .do(tree => this.onUpdate(<Tree>tree))
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

    //build a new location with the current path
    let instruction = this._router.generate(['Tree', this.treeForm.value])
    let home = this._location.normalize(this.user.home)
    let path = instruction.toUrlPath().replace(home, '')
    this._location.go(path, instruction.toUrlQuery())

    this.options = tree.options
  }

  /**
   * on load get current options based on route params or local storage options
   */
  ngOnInit() {
    //no timeout, no observer update :|
    setTimeout(() => {
      let params = <any>this._routeParams.params
      let options = this.storageOptions
      
      if(params.path == '')
        delete params.path

      //oh, it's probably the first time for the user, update manually
      if(!(Object.keys(options).length | Object.keys(params).length)) {
        (<any>this.tree).destination.observers[0].next(this.options)
        return
      }

      for(let i in this.options) {
        if(i in params) {
          this.options[i] = params[i]
        } else if (options[i]) {
          this.options[i] = options[i]
        }
      }
    })
  }

  /**
   * Workaround as radio inputs are not implemented yet
   */
  setOrderValue(v) {
    (<any>this.treeForm.controls).order.updateValue(v)
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

  /**
   * Getter options from localStorage
   */
  get storageOptions() {
    let opts = localStorage.getItem('tree_options')
    if(!opts)
      return {}

    opts = JSON.parse(opts)
    opts.search = ''
    return opts
  }

  /**
   * Setter options from localStorage
   */
  set storageOptions(opts: any) {
    let o: TreeOptions = new TreeOptions()
    for(let i in opts) { o = opts[i] }
    delete o.search
    localStorage.setItem('tree_options', JSON.stringify(opts))
  }

  /**
   * Navigate to options
   * - navigate({page: 2})
   * - navigate({path: 'new/path'})
   */
  navigate(options: Object) {

    let controls = this.treeForm.controls

    for(let i in options) {
      if(i in controls && controls[i].value != options[i]) {
        (<any>controls[i]).updateValue(options[i])
      }
    }
  }
}
