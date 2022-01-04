import {libdsvdc} from './libdsvdc';

export class DSBusinessLogic extends libdsvdc {
  constructor(config: any) {
    super(config);

    this.on('binaryInputStateRequest', this.binaryInputStateRequest.bind(this));
  }

  private binaryInputStateRequest() {
    console.log('TEEEEEEEESSST\n\n\n\n\n');
  }
}
