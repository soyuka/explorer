import {Pipe, PipeTransform} from 'angular2/core'

@Pipe({name: 'isArray'})
export class isArray implements PipeTransform {
  transform(v:any):any { 
    return Array.isArray(v);
  }
}
