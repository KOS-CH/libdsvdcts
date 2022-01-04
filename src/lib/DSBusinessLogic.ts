import {libdsvdc} from './libdsvdc';

export class DSBusinessLogic {
  events: libdsvdc;
  constructor(config: {events: libdsvdc}) {
    this.events = config.events;
    this.events.on(
      'binaryInputStateRequest',
      this.binaryInputStateRequest.bind(this)
    );
    this.events.on('sensorStatesRequest', this.sensorStatesRequest.bind(this));
  }

  private binaryInputStateRequest() {
    console.log('TEEEEEEEESSST\n\n\n\n\n');
  }

  private sensorStatesRequest() {
    console.log('SEEEEEEEEEEEEEEEEEEEEENSOR\n\n\n\n');
    this.events.emitGetState('getState', 'blah.0', () => {
      console.log('CAAALLLLBAAACK\n\n\n\n\n\n\n');
    });
  }
}
