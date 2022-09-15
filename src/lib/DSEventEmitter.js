"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.DSEventEmitter = void 0;
var events_1 = require("events");
var DSEventEmitter = /** @class */ (function (_super) {
    __extends(DSEventEmitter, _super);
    function DSEventEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DSEventEmitter.prototype.emitGetState = function (event, id, callback) {
        this.emit(event, id, callback);
    };
    DSEventEmitter.prototype.emitObject = function (event, obj) {
        if (obj === void 0) { obj = {}; }
        this.emit(event, obj);
    };
    return DSEventEmitter;
}(events_1.EventEmitter));
exports.DSEventEmitter = DSEventEmitter;
