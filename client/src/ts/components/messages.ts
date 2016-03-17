import {Component} from 'angular2/core'
import {isArray} from '../pipes/isArray'

import {MessagesService} from '../services/messages'

@Component({
  templateUrl: 'templates/messages.html',
  selector: 'explorer-messages',
  pipes: [isArray]
})

export class MessagesComponent {
  constructor(public messages: MessagesService) {
  }
}
