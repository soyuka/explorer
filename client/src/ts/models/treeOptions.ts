export class TreeOptions {

  public search: string = ''
  public page: number = 1
  public sort: string = 'name'
  public order: string = 'asc'
  public limit: number = 10
  private parent: string = ''
  private path: string = ''
  private root: string = ''
  private size: string = 0
  private pages: number = 0
  private num: number = 0
  private canRemove: boolean = false

  constructor(opts) {
    if(!opts)
      return

    for(let i in opts) {
      if(i in this) 
        this[i] = opts[i]
    }
  }
}
