import {Pipe, PipeTransform} from 'angular2/core'

@Pipe({name: 'get'})

export class Get implements PipeTransform {
  transform(v, args) { 
    if(!v) {
      return 
    }

    return v[args[0]]
  }
}
