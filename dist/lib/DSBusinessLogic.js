"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSBusinessLogic = void 0;
const libdsvdc_1 = require("./libdsvdc");
class DSBusinessLogic extends libdsvdc_1.libdsvdc {
    constructor(config) {
        super(config);
        this.on('binaryInputStateRequest', this.binaryInputStateRequest.bind(this));
    }
    binaryInputStateRequest() {
        console.log('TEEEEEEEESSST\n\n\n\n\n');
    }
}
exports.DSBusinessLogic = DSBusinessLogic;
//# sourceMappingURL=DSBusinessLogic.js.map