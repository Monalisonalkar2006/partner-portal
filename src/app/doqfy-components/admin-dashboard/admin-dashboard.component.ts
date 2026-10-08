import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: false,
})
export class AdminDashboardComponent implements OnInit {
  filterDate: any;
  startDate: any = '';
  endDate: any = '';

  latitude: number = 0;
  longitude: number = 0;
  city: string = '';
  state: string = '';
  locationError: string = '';

  // 🔑 Required by Nominatim's usage policy — update the app name / contact details
  private readonly nominatimHeaders = new HttpHeaders({
    'User-Agent': 'YourAppName/1.0 (contact@yourdomain.com)'
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // this.initializeGeofencingFlow();
  }

  async initializeGeofencingFlow(): Promise<void> {
    try {
      await this.getGeoLocationAndDetails();
      console.log('[AdminDashboard] Success: Complete Geofencing data captured. Proceeding with normal flow.');
    } catch (error) {
      console.warn('[AdminDashboard] Halted: User opted to stay back due to missing geofencing data.');
    }
  }

  oneDateChange(event: any): void {
    this.filterDate = event;
  }

  // ✅ Browser Geolocation API — 100% free, built-in, no external service
  getGeoLocationAndDetails(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const msg = 'Geolocation is not supported by your browser.';
        this.handleMissingData(msg, resolve, reject);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.locationError = '';

          console.log(`[AdminDashboard] Coordinates successfully captured: Lat ${this.latitude}, Lng ${this.longitude}`);

          const detailsFetched = await this.fetchCityState(this.latitude, this.longitude);

          if (!detailsFetched) {
            const msg = 'Coordinates captured, but failed to fetch City/State from the open-source API.';
            this.handleMissingData(msg, resolve, reject);
          } else {
            resolve();
          }
        },
        (error) => {
          const messages: Record<number, string> = {
            1: 'Location permission was denied. Please allow access in browser settings.',
            2: 'Location information is currently unavailable (Network/GPS issue).',
            3: 'Location request timed out. Please try again.',
          };
          const msg = messages[error.code] ?? 'An unknown location error occurred.';
          console.error('[AdminDashboard] Geolocation API error:', error);
          this.handleMissingData(msg, resolve, reject);
        },
        {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 0,
        }
      );
    });
  }

  // ✅ Nominatim (OpenStreetMap) — free, with required User-Agent header added
  async fetchCityState(lat: number, lon: number): Promise<boolean> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

    try {
      console.log(`[AdminDashboard] Fetching geo-details from Nominatim for Lat: ${lat}, Lon: ${lon}...`);

      const response: any = await lastValueFrom(
        this.http.get(url, { headers: this.nominatimHeaders })
      );

      if (response && response.address) {
        this.city  = response.address.city
                  || response.address.town
                  || response.address.village
                  || response.address.county
                  || 'Unknown City';
        this.state = response.address.state || 'Unknown State';

        console.log(`[AdminDashboard] Reverse Geocoding Success: City - ${this.city}, State - ${this.state}`);
        return true;
      } else {
        console.error('[AdminDashboard] Invalid response format from Nominatim API:', response);
        return false;
      }
    } catch (error) {
      console.error('[AdminDashboard] HTTP error while hitting Nominatim API:', error);
      return false;
    }
  }

  handleMissingData(reason: string, resolve: any, reject: any): void {
    this.locationError = reason;
    console.error(`[AdminDashboard] GEOFENCING FAILED: ${reason}`);

    const proceedAnyway = window.confirm(
      `⚠️ Geofencing Data Warning ⚠️\n\n` +
      `We could not capture your complete location details which may require for esign audit trail (Latitude/Longitude or City/State).\n\n` +
      `Reason: ${reason}\n\n` +
      `Do you want to PROCEED without this information?\n\n` +
      `- Click "OK" to Proceed anyway.\n` +
      `- Click "Cancel" to Stay Back.`
    );

    if (proceedAnyway) {
      console.log('[AdminDashboard] User selected "OK". Bypassing geofencing block and proceeding.');
      resolve();
    } else {
      console.log('[AdminDashboard] User selected "Cancel". Staying back.');
      reject(new Error(reason));
    }
  }
}