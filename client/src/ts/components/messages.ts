import {Component} from 'angular2/core'
import {MessagesService} from 'services/messages'

@Component({
  templateUrl: 'templates/messages.html',
  selector: 'explorer-messages',
  providers: [MessagesService]
})

export class MessagesComponent {
  constructor(public messages: MessagesService) {
  }
}
