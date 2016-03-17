import {TreeOptions} from './treeOptions'

export class Tree {
  public tree: any
  public breadcrumb: Array<string> = []
  public options: TreeOptions

  constructor(tree: any = {}) {
    this.tree = tree.tree
    this.options = new TreeOptions(tree.options)
    this.breadcrumb = tree.breadcrumb
  }

  contains(property, value): boolean {
    let result = false

    for(let i in this.tree) {
      let element = this.tree[i]
      if(property in element) {
        if(Array.isArray(value)) 
          return !!~value.indexOf(element.property)
        else
          return value == element.property
      }
    }
  }

  get pages(): Array<number> {
    let pages = []
    for(let i = 0; i < this.options.pages; i++) {
      pages[i] = i+1
    }

    return pages
  }
}
