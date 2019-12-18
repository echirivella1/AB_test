import { Injectable } from '@angular/core';
import { HttpRequest, HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Events } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ReplaySubject, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { CommunityPlugins } from '../community-plugin';

const MAPFRE_ID = 'MAPFRE_ID';
const VERSION = '0.0.1';
const VERSIONCODE = '1';
const ENVNAME = 'dev';

@Injectable()
export class FirebaseService {

  static readonly VERSION_DISABLED_EVENT = 'digitalhealth_version_disabled';

  private config;
  private readonly localConfig = 'assets/remoteConfig.json';
  private readonly lastConfigStoredKey = 'digitalhealth_last_config_stored';
  private readonly lastVersionCodeConfigStored = 'digitalhealth_last_version_code_config_stored';

  private readyObservable = new ReplaySubject(1);

  constructor(
    private router: Router,
    private events: Events,
    private http: HttpClient,
    private storage: Storage,
  ) {}

  async init() {
    await this.setUserProperties();
    await this.setAnalyticsUserId();
    await this.checkIfUpdatedVersionAndRemoveRemoteConfigCache();
    this.fetchRemoteConfig();
    this.initAutoTrackNavigation();
    this.events.subscribe('onLogin', () => {
      this.setUserProperties();
      this.setAnalyticsUserId();
    });
  }

  // User properties - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  private async setUserProperties() {
    await CommunityPlugins.Firebase.setUserProperty({ name: 'mapfreId', value: MAPFRE_ID });
    await CommunityPlugins.Firebase.setUserProperty({ name: 'version', value: VERSION });
    await CommunityPlugins.Firebase.setUserProperty({ name: 'versionCode', value: VERSIONCODE });
    await CommunityPlugins.Firebase.setUserProperty({ name: 'environment', value: ENVNAME });
  }

  // Analytics User ID - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  private async setAnalyticsUserId() {
    await CommunityPlugins.Firebase.setUserId({ userId: MAPFRE_ID });
  }

  // Remote config - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  async fetchRemoteConfig() {
    const getConfigResolve = async () => {
      this.config = await new Promise((resolve, reject) => {
        CommunityPlugins.Firebase.getRemoteConfigValue({ key: 'config' }).then(async (res) => {
          if (res && res.value) {
            const config = JSON.parse(res.value);
            await this.storage.set(this.lastConfigStoredKey, config);
            console.log(`Firebase getValue: config updated`);
            resolve(config);
          } else {
            console.log(`Firebase getValue: return last config stored`);
            resolve(await this.getRemoteConfigLocalData());
          }
        }, async (err) => {
          console.log(`Firebase getValue: error getting RemoteConfig, return config stored`);
          resolve(await this.getRemoteConfigLocalData());
        });
      });
      this.setReady();
    };
    // Config cached one hour
    CommunityPlugins.Firebase.fetch({ cache: 5000000 }).then(() => {
      CommunityPlugins.Firebase.activateFetched().then(async (res) => {
        if (res && res.activated) {
          console.log(`Firebase activateFetched: there was a config and it was activated`);
        } else {
          console.log(`Firebase activateFetched: no config was found or was already activated`);
        }
        await getConfigResolve();
      }, async (error) => {
        console.log(`Firebase activateFetched fails`);
        await getConfigResolve();
      });
    }, async (error) => {
      console.log(`Firebase fetch fails`);
      await getConfigResolve();
    });
  }

  private setReady() {
    this.readyObservable.next(true);
    this.readyObservable.complete();
    this.checkIfVersionEnabled();
  }

  ready() {
    return this.readyObservable.asObservable();
  }

  getConfigValue(key: string) {
    return this.ready().pipe(
      switchMap(() => {
        if (!this.config) { return of(null); }
        return of(this.config[key]);
      })
    );
  }

  private checkIfVersionEnabled() {
    this.getConfigValue('enabledVersion').subscribe((isVersionEnabled: boolean) => {
      if (isVersionEnabled === false) {
        this.events.publish(FirebaseService.VERSION_DISABLED_EVENT);
        return of(false);
      }
      return of(true);
    });
  }

  private async checkIfUpdatedVersionAndRemoveRemoteConfigCache() {
    const currentVersionCode = VERSIONCODE;
    const lastVersionCode = await this.storage.get(this.lastVersionCodeConfigStored);
    if (currentVersionCode !== lastVersionCode) {
      await this.storage.set(this.lastConfigStoredKey, null);
      await this.storage.set(this.lastVersionCodeConfigStored, currentVersionCode);
    }
  }

  private async getRemoteConfigLocalData() {
    let config = await this.storage.get(this.lastConfigStoredKey);
    if (config) { return config; }
    try {
      config = await this.http.get(this.localConfig).toPromise();
    } catch (e) {
      console.error(`Error loading local config getRemoteConfigLocalData:`, this.localConfig);
    }
    return config;
  }

  // Analytics - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  private initAutoTrackNavigation() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // undo support/hack to navigate to the same page
        const url = event.url.replace(/(\/timestamp_)\d+/, '');
        CommunityPlugins.Firebase.setScreenName({ screenName: url });
      });
  }

  trackHttpEvent(req: HttpRequest<any>, data: any, type: 'success' | 'error') {
    const url = req.url;
    const eventName = url.indexOf('/') >= 0 ? url.split('/')[1] : url;
    const obj = {
      type: eventName,
      url,
      success: type === 'success',
      method: req.method,
      httpStatus: data.status
    };
    CommunityPlugins.Firebase.logEvent({ name: 'http_event', parameters: obj });
  }

  // Messaging

  /**
   * Returns Firebase token. It's different from APNS token on iOS.
   */
  getPushToken() {
    return CommunityPlugins.Firebase.getToken();
  }

}
