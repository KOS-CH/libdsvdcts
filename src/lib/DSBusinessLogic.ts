import {libdsvdc} from './libdsvdc';

export class DSBusinessLogic {
  constructor(config: {events: libdsvdc}) {
    config.events.on(
      'binaryInputStateRequest',
      this.binaryInputStateRequest.bind(this)
    );
  }

  private binaryInputStateRequest() {
    console.log('TEEEEEEEESSST\n\n\n\n\n');
  }
}
