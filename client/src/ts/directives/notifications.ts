//@TODO close (remove from server) 1 notification
import {Directive, ElementRef, Renderer} from 'angular2/core'

@Directive({
  selector: '[notifications]',
  host: {
    '(click)': 'onClick'
  }
})

export class NotificationsDirective {
  constructor(private el: ElementRef, private renderer: Renderer) {}

  onClick() { this._toggle() }

  private _toggle() {
    console.log(this.renderer);
  }
}
