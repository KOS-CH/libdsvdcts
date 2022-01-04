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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.libdsvdc = void 0;
var DSEventEmitter_1 = require("./DSEventEmitter");
var libdsutil_1 = require("./libdsutil");
var net = require("net");
var dnssd = require("dnssd");
var path = require("path");
var protobuf = require("protobufjs");
var dsCommunication_1 = require("./dsCommunication");
var libdsvdc = /** @class */ (function (_super) {
    __extends(libdsvdc, _super);
    function libdsvdc(config) {
        var _this = _super.call(this, config) || this;
        _this._vdcSendPushProperty = dsCommunication_1._vdcSendPushProperty;
        _this._vdcPushChannelStates = dsCommunication_1._vdcPushChannelStates;
        _this._vdsmResponseHello = dsCommunication_1._vdsmResponseHello;
        _this._vdcSendAnnounceVdc = dsCommunication_1._vdcSendAnnounceVdc;
        _this._vdcSendPong = dsCommunication_1._vdcSendPong;
        _this._genericResponse = dsCommunication_1._genericResponse;
        _this._vdcSendAnnounceDevice = dsCommunication_1._vdcSendAnnounceDevice;
        _this.config = config;
        _this.debug = config.debug;
        _this.messageId = 0;
        _this.messagePath = path.join(__dirname, "/messages/messages.proto");
        _this.root = protobuf.loadSync(_this.messagePath);
        _this.vdsm = _this.root.lookupType("Message");
        _this.VERSION = "0.0.1";
        _this.MODEL = "ioBroker VDC";
        _this.VENDORNAME = "KYUKA";
        setTimeout(function () {
            _this.emitGetState('test', 'blah.0.test', _this._MyCallback.bind(_this));
        }, 5 * 1000);
        return _this;
    }
    libdsvdc.prototype._MyCallback = function (args) {
        console.log(args);
    };
    /**
     * Start a new instance of a VDC
     * @param {Object} config
     * @param {Array} devices
     */
    libdsvdc.prototype.start = function (config, devices) {
        if (devices === void 0) { devices = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, handleConnection, server;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!config.vdcDSUID || config.vdcDSUID.length != 34) {
                            // no vdcDSUID set -> exiting
                            return [2 /*return*/, { error: 99, text: "vdcDSUID missing" }];
                        }
                        else {
                            this.config.vdcDSUID = config.vdcDSUID;
                        }
                        if (!config.vdcName || config.vdcName.length <= 0) {
                            // no name set -> existing
                            return [2 /*return*/, { error: 99, text: "vdcName missing" }];
                        }
                        else {
                            this.config.vdcName = config.vdcName;
                        }
                        if (!!config.port) return [3 /*break*/, 2];
                        _a = this.config;
                        return [4 /*yield*/, (0, libdsutil_1.getFreePort)()];
                    case 1:
                        _a.port = _b.sent();
                        if (this.debug)
                            console.log("No port provided -> using %d", this.config.port);
                        return [3 /*break*/, 3];
                    case 2:
                        this.config.port = config.port;
                        _b.label = 3;
                    case 3:
                        this.devices = devices;
                        handleConnection = function (conn) {
                            var remoteAddress = conn.remoteAddress + ":" + conn.remotePort;
                            if (_this.debug)
                                console.log("new client connection from %s", remoteAddress);
                            var onConnData = function (d) {
                                if (_this.debug)
                                    console.log("\n---------------------------\nconnection data from %s: %j", remoteAddress, d);
                                try {
                                    var decodedMessage_1;
                                    decodedMessage_1 = _this.vdsm.decode(d.slice(2));
                                    /**
                                     * @event messageReceived - New message received from VDSM
                                     * @type {Object}
                                     * @property Message Object
                                     */
                                    _this.emitObject("messageReceived", decodedMessage_1);
                                    if (_this.debug)
                                        console.log(JSON.stringify(decodedMessage_1));
                                    var answerBuf = null;
                                    if (decodedMessage_1.type == 2) {
                                        // VDSM_REQUEST_HELLO
                                        // send RESPONSE HELLO
                                        _this._vdsmResponseHello(conn, decodedMessage_1);
                                        // send vdcAnnounceVdc
                                        _this._vdcSendAnnounceVdc(conn);
                                        // send announcedevice for each device
                                        /* if (self.devices && self.devices.length > 0) {
                                          self.devices.forEach((dev) => {
                                            if (dev.dSUID && dev.dSUID.length > 0) {
                                              self._vdcSendAnnounceDevice(conn, dev.dSUID);
                                            }
                                          });
                                        } */
                                    }
                                    else if (decodedMessage_1.type == 8) {
                                        // VDSM_SEND_PING
                                        // send VDC_SEND_PONG
                                        _this._vdcSendPong(conn, decodedMessage_1);
                                    }
                                    else if (decodedMessage_1.type == 4) {
                                        // VDSM_REQUESTGETPROPERTIES
                                        // send _vdcResponseGetProperty
                                        // TODO add function externally
                                        // this._vdcResponseGetProperty(conn, decodedMessage);
                                    }
                                    else if (decodedMessage_1.type == 6) {
                                        // VDSM_SETPROPERTY
                                        // TODO implement logic
                                        // search for device and store the zone there
                                        var device = _this.devices.find(function (d) {
                                            return d.dSUID.toLowerCase() ==
                                                decodedMessage_1.vdsmRequestSetProperty.dSUID.toLowerCase();
                                        });
                                        if (device) {
                                            // device found
                                            device.zoneID =
                                                decodedMessage_1.vdsmRequestSetProperty.properties[0].value
                                                    .vUint64 || 65534;
                                            _this.emitObject("deviceZoneChange", {
                                                request: decodedMessage_1.vdsmRequestSetProperty,
                                                devices: _this.devices
                                            });
                                        }
                                        _this._genericResponse(conn, { code: 0, description: "OK" }, decodedMessage_1.messageId);
                                    }
                                    else if (decodedMessage_1.type == 1) {
                                        _this._parseGenericResponse(decodedMessage_1);
                                    }
                                    else if (decodedMessage_1.type == 15) {
                                        // VDSM_NOTIFICATION_CALL_SCENE = 15;
                                        if (decodedMessage_1.vdsmSendCallScene) {
                                            _this.emitObject("VDSM_NOTIFICATION_CALL_SCENE", decodedMessage_1.vdsmSendCallScene);
                                        }
                                    }
                                    else if (decodedMessage_1.type == 16) {
                                        // VDSM_NOTIFICATION_SAVE_SCENE = 16;
                                        if (decodedMessage_1.vdsmSendSaveScene) {
                                            _this.emitObject("VDSM_NOTIFICATION_SAVE_SCENE", decodedMessage_1.vdsmSendSaveScene);
                                        }
                                    }
                                    else if (decodedMessage_1.type == 17) {
                                        // VDSM_NOTIFICATION_UNDO_SCENE = 17;
                                    }
                                    else if (decodedMessage_1.type == 21) {
                                        // VDSM_NOTIFICATION_SET_CONTROL_VALUE
                                        if (decodedMessage_1.vdsmSendSetControlValue) {
                                            _this.emitObject("VDSM_NOTIFICATION_SET_CONTROL_VALUE", decodedMessage_1.vdsmSendSetControlValue);
                                        }
                                    }
                                    else if (decodedMessage_1.type == 25) {
                                        // VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE
                                        if (decodedMessage_1.vdsmSendOutputChannelValue) {
                                            _this.emitObject("VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE", decodedMessage_1.vdsmSendOutputChannelValue);
                                        }
                                    }
                                }
                                catch (err) {
                                    console.error(err);
                                }
                            };
                            var onConnClose = function () {
                                if (_this.debug)
                                    console.log("connection from %s closed", remoteAddress);
                            };
                            var onConnError = function (err) {
                                if (_this.debug)
                                    console.log("Connection %s error: %s", remoteAddress, err.message);
                            };
                            conn.on("data", onConnData);
                            conn.once("close", onConnClose);
                            conn.on("error", onConnError);
                            _this.on("vdcSendPushProperty", function (message) {
                                _this._vdcSendPushProperty(conn, message);
                            });
                            _this.on("vdcPushChannelStates", function (answerBuf) {
                                _this._vdcPushChannelStates(conn, answerBuf);
                            });
                            _this.on("vdcAnnounceDevices", function () {
                                if (_this.devices && _this.devices.length > 0) {
                                    _this.devices.forEach(function (dev) {
                                        if (dev.dSUID && dev.dSUID.length > 0) {
                                            _this._vdcSendAnnounceDevice(conn, dev.dSUID);
                                        }
                                    });
                                }
                            });
                        };
                        server = net.createServer();
                        server.on("connection", handleConnection);
                        server.listen({ port: this.config.port }, function () {
                            if (_this.debug)
                                console.log("server listening to %j", server.address());
                        });
                        // advertise server
                        this._initDNSSD();
                        setImmediate(function () {
                            /**
                             * @event vdcRunningState - Sent when the VDC is fully initialized
                             */
                            _this.emitObject("vdcRunningState", { running: true });
                        });
                        console.log("VDC initialized on port ".concat(this.config.port, " and running"));
                        return [2 /*return*/, { error: 0, text: "VDC initialized on port ".concat(this.config.port, " and running") }];
                }
            });
        });
    };
    libdsvdc.prototype._initDNSSD = function () {
        var _this = this;
        var serviceType = new dnssd.ServiceType("_ds-vdc._tcp");
        if (this.debug)
            console.log(serviceType);
        var ad = new dnssd.Advertisement(serviceType, this.config.port, {
            name: this.config.vdcName,
            txt: { dSUID: this.config.vdcDSUID }
        });
        ad.start()
            .on("error", function (err) {
            if (_this.debug)
                console.log("Error:", err);
        })
            .on("stopped", function (stop) {
            if (_this.debug)
                console.log("Stopped", stop);
        })
            .on("instanceRenamed", function (instanceRenamed) {
            if (_this.debug)
                console.log("instanceRenamed", instanceRenamed);
        })
            .on("hostRenamed", function (hostRenamed) {
            if (_this.debug)
                console.log("hostRenamed", hostRenamed);
        });
    };
    /**
     * Parse genericResponse to show errors
     * @param {Object} decodedMessage
     */
    libdsvdc.prototype._parseGenericResponse = function (decodedMessage) {
        var errorMapping = {
            ERR_OK: "Everything alright",
            ERR_MESSAGE_UNKNOWN: "The message id is unknown. This might happen due to incomplete or incompatible implementation",
            ERR_INCOMPATIBLE_API: "The API version of the VDSM is not compatible with this VDC.",
            ERR_SERVICE_NOT_AVAILABLE: "The VDC cannot respond. Might happen bcause the VDC is already connected to another VDSM.",
            ERR_INSUFFICIENT_STORAGE: "The VDC could not store the related data.",
            ERR_FORBIDDEN: "ERR_FORBIDDEN 5 The call is not allowed.",
            ERR_NOT_IMPLEMENTED: "Not (yet) implemented.",
            ERR_NO_CONTENT_FOR_ARRAY: "Array data was expected.",
            ERR_INVALID_VALUE_TYPE: "Invalid data type",
            ERR_MISSING_SUBMESSAGE: "Submessge was expected.",
            ERR_MISSING_DATA: "Additional data was exptected.",
            ERR_NOT_FOUND: "Addredded entity or object was not found.",
            ERR_NOT_AUTHORIZED: "The caller is not authorized with the Native Device"
        };
        if (decodedMessage &&
            decodedMessage.genericResponse &&
            decodedMessage.genericResponse.code) {
            if (this.debug) {
                var code = decodedMessage.genericResponse.code;
                console.info("Generic response with message ".concat(errorMapping[code], " received"));
            }
        }
    };
    return libdsvdc;
}(DSEventEmitter_1.DSEventEmitter));
exports.libdsvdc = libdsvdc;
