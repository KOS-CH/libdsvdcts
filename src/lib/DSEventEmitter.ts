import {EventEmitter} from 'events';

export class DSEventEmitter extends EventEmitter {
  emitGetState(event: string, id: string, callback: Function) {
    this.emit(event, id, callback);
  }

  emitSetState(id: string, value: any, ack: boolean, callback: Function) {
    this.emit('setIOBState', id, value, ack, callback);
  }

  emitObject(event: string, obj = {}) {
    this.emit(event, obj);
  }
}
