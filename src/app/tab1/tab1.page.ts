import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {
  abTestBlue = false; // By default, do not enable a specific AB case

  constructor(
    private firebase: FirebaseService
  ) {}

  ngOnInit() {
    this.firebase.getConfigValue('ab_test_tabOne_blue').subscribe(value => this.abTestBlue = value);
  }
}
