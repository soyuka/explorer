import {it, describe, expect, beforeEach, inject} from 'angular2/testing'

export function main() {
  describe('Tree', () => {

    let t: any;

    beforeEach(() => {
      console.log('test'); 
      t = 'hello'
    })

    it('should test', () => {
      console.log(t); 
    })
  })

}
