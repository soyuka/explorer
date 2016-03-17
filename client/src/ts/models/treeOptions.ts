export class TreeOptions {

  public search: string = ''
  public page: number = 1
  public sort: string = 'name'
  public order: string = 'asc'
  public limit: number = 10
  public pages: number = 0
  private parent: string = ''
  private path: string = ''
  private root: string = ''
  private num: number = 0
  private canRemove: boolean = false

  constructor(opts: any = null) {
    if(!opts)
      return

    for(let i in opts) {
      if(i in this) 
        this[i] = opts[i]
    }
  }
}
