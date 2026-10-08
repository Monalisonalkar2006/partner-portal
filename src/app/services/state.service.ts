import { Injectable } from '@angular/core';
import { GenericHttpService } from './generic-http.service';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  constructor( public httpService: GenericHttpService) { }

 
  getState() {
    return this.httpService.Get('/states/');
  }

  getStatesWithBranches(id) {
    return this.httpService.Get(`/account/branch-states/?account_id=${id}`);
  }

}
