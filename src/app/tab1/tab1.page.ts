import { Component } from '@angular/core';
import { FirebaseService } from '../services/firebase';
import { of } from 'rxjs';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  myFirebaseDemo = of('default value');

  constructor(
    private firebase: FirebaseService,
    private platform: Platform
  ) {}

  async ionViewWillEnter() {
    if (this.platform.is('hybrid')) {
      await this.firebase.init();
    }
  }

  ionViewDidEnter() {
    this.myFirebaseDemo = this.firebase.getConfigValue('myFirebaseDemo');
  }
}
