import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {

  // Default values for A/B test
  abTestBigWelcome = false;
  abTestResourcesBackgroundColor = '#FFF';
  abTestResourcesLayout = '1';

  constructor(
    private firebase: FirebaseService
  ) {}

  ngOnInit() {
    this.setupAbTest();
  }

  async setupAbTest() {
    this.abTestBigWelcome = await this.firebase.getAbTestConfigValue('tabTwo_bigWelcome').toPromise();
    this.abTestResourcesBackgroundColor = await this.firebase.getAbTestConfigValue('tabTwo_resourcesBackgroundColor').toPromise();
    this.abTestResourcesLayout = await this.firebase.getAbTestConfigValue('tabTwo_resourcesLayout').toPromise();
  }

}
