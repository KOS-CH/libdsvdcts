"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSBusinessLogic = void 0;
class DSBusinessLogic {
    constructor(config) {
        this.events = config.events;
        this.events.on('binaryInputStateRequest', this.binaryInputStateRequest.bind(this));
        this.events.on('sensorStatesRequest', this.sensorStatesRequest.bind(this));
    }
    binaryInputStateRequest() {
        console.log('TEEEEEEEESSST\n\n\n\n\n');
    }
    sensorStatesRequest() {
        console.log('SEEEEEEEEEEEEEEEEEEEEENSOR\n\n\n\n');
        this.events.emitGetState('getState', 'blah.0', () => {
            console.log('CAAALLLLBAAACK\n\n\n\n\n\n\n');
        });
    }
}
exports.DSBusinessLogic = DSBusinessLogic;
//# sourceMappingURL=DSBusinessLogic.js.map