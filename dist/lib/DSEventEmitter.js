"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSEventEmitter = void 0;
const events_1 = require("events");
class DSEventEmitter extends events_1.EventEmitter {
    emitGetState(event, id, callback) {
        this.emit(event, id, callback);
    }
    emitSetState(id, value, ack, callback) {
        this.emit('setIOBState', id, value, ack, callback);
    }
    emitObject(event, obj = {}) {
        this.emit(event, obj);
    }
}
exports.DSEventEmitter = DSEventEmitter;
//# sourceMappingURL=DSEventEmitter.js.map