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
  abTestBlue = false; // By default, do not enable a specific AB case

  constructor(
    private firebase: FirebaseService
  ) {}

  async ionViewWillEnter() {
    this.firebase.getConfigValue('ab_test_tabOne_blue').subscribe(value => this.abTestBlue = value);
  }
}
