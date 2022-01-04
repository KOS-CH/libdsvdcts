"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSBusinessLogic = void 0;
class DSBusinessLogic {
    constructor(config) {
        config.events.on('binaryInputStateRequest', this.binaryInputStateRequest.bind(this));
        config.events.on('sensorStatesRequest', this.sensorStatesRequest.bind(this));
    }
    binaryInputStateRequest() {
        console.log('TEEEEEEEESSST\n\n\n\n\n');
    }
    sensorStatesRequest() {
        console.log('SEEEEEEEEEEEEEEEEEEEEENSOR\n\n\n\n');
    }
}
exports.DSBusinessLogic = DSBusinessLogic;
//# sourceMappingURL=DSBusinessLogic.js.map