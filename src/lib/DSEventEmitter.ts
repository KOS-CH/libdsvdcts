import {EventEmitter} from 'events';

export class DSEventEmitter extends EventEmitter {
  emitGetState(
    id: string | Array<{[key: string]: string}>,
    callback: Function
  ) {
    const event: string = 'getIOBState';
    this.emit(event, id, callback);
  }

  emitSetState(id: string, value: any, ack: boolean, callback: Function) {
    const event: string = 'setIOBState';
    this.emit(event, id, value, ack, callback);
  }

  emitObject(event: string, obj = {}) {
    this.emit(event, obj);
  }

  log(type: 'silly' | 'debug' | 'info' | 'warn' | 'error', msg: string) {
    this.emit('vdcLog', type, msg);
  }
}
