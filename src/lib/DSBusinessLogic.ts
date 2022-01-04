import {libdsvdc} from './libdsvdc';

export class DSBusinessLogic {
  constructor(config: {events: libdsvdc}) {
    config.events.on(
      'binaryInputStateRequest',
      this.binaryInputStateRequest.bind(this)
    );
    config.events.on(
      'sensorStatesRequest',
      this.sensorStatesRequest.bind(this)
    );
  }

  private binaryInputStateRequest() {
    console.log('TEEEEEEEESSST\n\n\n\n\n');
  }

  private sensorStatesRequest() {
    console.log('SEEEEEEEEEEEEEEEEEEEEENSOR\n\n\n\n');
  }
}
