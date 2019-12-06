import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatService, Message } from '../chat.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/scan';
import { SpeechRecognitionService } from '../../speech-recognition.service';

@Component({
  selector: 'app-chat-dialog',
  templateUrl: './chat-dialog.component.html',
  styleUrls: ['./chat-dialog.component.css']
})
export class ChatDialogComponent implements OnInit {
  @ViewChild('sendButtonRef') sendButtonRef: ElementRef;

  //SpeechRecognition variables
  startListenButton: boolean;
  stopListeningButton: boolean;
  speechData: string;
  
  //DialogFlow variables
  messages: Observable<Message[]>;
  formValue: string;

  constructor(public chat: ChatService,
    private speechRecognitionService: SpeechRecognitionService) {
      this.startListenButton = true;
      this.stopListeningButton = false;
      this.speechData = "";
  }

  ngOnInit() {
        // DialogFlow setup: appends to array after each new message is added to feedSource
        this.messages = this.chat.conversation.asObservable()
        .scan((acc, val) => acc.concat(val) );
  }

  sendMessage() {
    this.chat.converse(this.formValue);
    // this.setListener();
    this.messages.subscribe(val => console.log('component amy 1', val));
    // WIP: doesnt work. Still listens to itself
    let robotResponse: any;
    this.messages.subscribe(val => {
      
      robotResponse = val;
      const total = (robotResponse.length -1) < 0 ? 0 : robotResponse.length -1;
      
      let lastRobotResponse = robotResponse[total]
      
      if (total == 1 && lastRobotResponse.sentBy == 'bot') {
        if (this.startListenButton && !this.stopListeningButton) {
          
          this.activateSpeechSearch();
        }
      }
    })

    this.formValue = '';

  }

  //SpeechRecognition related implementations below
  ngOnDestroy() {
    this.speechRecognitionService.DestroySpeechObject();
  }

  activateSpeechSearch(): void {
    this.startListenButton = false;

    this.speechRecognitionService.record()
        .subscribe(
        //listener
        (value) => {
            this.speechData = value;
            this.formValue = value;
            
        },
        //error
        (err) => {
         
            if (err.error == "no-speech") {
                
                this.activateSpeechSearch();
            }
        },
        //completion
        () => {
            
            
            this.sendMessageFromSpeechRecognition();
            

        });
  }

  deActivateSpeechSearch(): void {
    this.startListenButton = true;
    this.stopListeningButton = true;
    this.speechRecognitionService.DestroySpeechObject();
  }

  sendMessageFromSpeechRecognition(): void {
    this.speechRecognitionService.DestroySpeechObject();
    this.sendMessage();
     setTimeout(() => {
       
       this.sendMessage();
    }, 8000);
    let element: HTMLElement = this.sendButtonRef.nativeElement as HTMLElement;
     element.click();
  }
}
