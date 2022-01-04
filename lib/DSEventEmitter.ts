import { EventEmitter } from "events";

export class DSEventEmitter extends EventEmitter {

    emitGetState(event: string, id: string, callback: Function) {
        this.emit(event, id, callback);
    }

    emitObject(event: string, obj = {}) {
        this.emit(event, obj)
    }
}