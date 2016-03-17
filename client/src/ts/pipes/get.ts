import {Pipe, PipeTransform} from 'angular2/core'

/**
 * Get the requested property at attribute X
 * Usage
 *  object | get:"key" (object.key)
 * For example:
 *   %tr{'*ngFor': '#element of Observable | async | get:"tree"'}
 *
 * The async pipes returns an Object which returns result.tree, 
 * which is an array
 */
@Pipe({name: 'get'})
export class Get implements PipeTransform {
  transform(v, args) { 
    if(!v) {
      return 
    }

    return v[args[0]]
  }
}
