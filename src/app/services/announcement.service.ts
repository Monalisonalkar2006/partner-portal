import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private hasSeenAnnouncement = false;

  constructor() { }

  getAnnouncementStatus(): boolean {
    return this.hasSeenAnnouncement;
  }

  setAnnouncementStatus(status: boolean): void {
    this.hasSeenAnnouncement = status;
  }
}
