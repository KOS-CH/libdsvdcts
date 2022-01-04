"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.libdsvdc = void 0;
const DSEventEmitter_1 = require("./DSEventEmitter");
const libdsutil_1 = require("./libdsutil");
const net = __importStar(require("net"));
const dnssd = __importStar(require("dnssd"));
const path = __importStar(require("path"));
const protobuf = __importStar(require("protobufjs"));
const dsCommunication_1 = require("./dsCommunication");
class libdsvdc extends DSEventEmitter_1.DSEventEmitter {
    constructor(config) {
        super(config);
        this._vdcSendPushProperty = dsCommunication_1._vdcSendPushProperty;
        this._vdcPushChannelStates = dsCommunication_1._vdcPushChannelStates;
        this._vdsmResponseHello = dsCommunication_1._vdsmResponseHello;
        this._vdcSendAnnounceVdc = dsCommunication_1._vdcSendAnnounceVdc;
        this._vdcSendPong = dsCommunication_1._vdcSendPong;
        this._genericResponse = dsCommunication_1._genericResponse;
        this._vdcSendAnnounceDevice = dsCommunication_1._vdcSendAnnounceDevice;
        this.config = config;
        this.debug = config.debug;
        this.messageId = 0;
        this.messagePath = path.join(__dirname, "/messages/messages.proto");
        this.root = protobuf.loadSync(this.messagePath);
        this.vdsm = this.root.lookupType("Message");
        this.VERSION = "0.0.1";
        this.MODEL = "ioBroker VDC";
        this.VENDORNAME = "KYUKA";
        setTimeout(() => {
            this.emitGetState('test', 'blah.0.test', this._MyCallback.bind(this));
        }, 5 * 1000);
    }
    _MyCallback(args) {
        console.log(args);
    }
    /**
     * Start a new instance of a VDC
     * @param {Object} config
     * @param {Array} devices
     */
    start(config, devices = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!config.vdcDSUID || config.vdcDSUID.length != 34) {
                // no vdcDSUID set -> exiting
                return { error: 99, text: "vdcDSUID missing" };
            }
            else {
                this.config.vdcDSUID = config.vdcDSUID;
            }
            if (!config.vdcName || config.vdcName.length <= 0) {
                // no name set -> existing
                return { error: 99, text: "vdcName missing" };
            }
            else {
                this.config.vdcName = config.vdcName;
            }
            if (!config.port) {
                this.config.port = yield (0, libdsutil_1.getFreePort)();
                if (this.debug)
                    console.log("No port provided -> using %d", this.config.port);
            }
            else {
                this.config.port = config.port;
            }
            this.devices = devices;
            const handleConnection = (conn) => {
                var remoteAddress = conn.remoteAddress + ":" + conn.remotePort;
                if (this.debug)
                    console.log("new client connection from %s", remoteAddress);
                const onConnData = (d) => {
                    if (this.debug)
                        console.log("\n---------------------------\nconnection data from %s: %j", remoteAddress, d);
                    try {
                        let decodedMessage;
                        decodedMessage = this.vdsm.decode(d.slice(2));
                        /**
                         * @event messageReceived - New message received from VDSM
                         * @type {Object}
                         * @property Message Object
                         */
                        this.emitObject("messageReceived", decodedMessage);
                        if (this.debug)
                            console.log(JSON.stringify(decodedMessage));
                        let answerBuf = null;
                        if (decodedMessage.type == 2) {
                            // VDSM_REQUEST_HELLO
                            // send RESPONSE HELLO
                            this._vdsmResponseHello(conn, decodedMessage);
                            // send vdcAnnounceVdc
                            this._vdcSendAnnounceVdc(conn);
                            // send announcedevice for each device
                            /* if (self.devices && self.devices.length > 0) {
                              self.devices.forEach((dev) => {
                                if (dev.dSUID && dev.dSUID.length > 0) {
                                  self._vdcSendAnnounceDevice(conn, dev.dSUID);
                                }
                              });
                            } */
                        }
                        else if (decodedMessage.type == 8) {
                            // VDSM_SEND_PING
                            // send VDC_SEND_PONG
                            this._vdcSendPong(conn, decodedMessage);
                        }
                        else if (decodedMessage.type == 4) {
                            // VDSM_REQUESTGETPROPERTIES
                            // send _vdcResponseGetProperty
                            // TODO add function externally
                            // this._vdcResponseGetProperty(conn, decodedMessage);
                        }
                        else if (decodedMessage.type == 6) {
                            // VDSM_SETPROPERTY
                            // TODO implement logic
                            // search for device and store the zone there
                            const device = this.devices.find((d) => d.dSUID.toLowerCase() ==
                                decodedMessage.vdsmRequestSetProperty.dSUID.toLowerCase());
                            if (device) {
                                // device found
                                device.zoneID =
                                    decodedMessage.vdsmRequestSetProperty.properties[0].value
                                        .vUint64 || 65534;
                                this.emitObject("deviceZoneChange", {
                                    request: decodedMessage.vdsmRequestSetProperty,
                                    devices: this.devices,
                                });
                            }
                            this._genericResponse(conn, { code: 0, description: "OK" }, decodedMessage.messageId);
                        }
                        else if (decodedMessage.type == 1) {
                            this._parseGenericResponse(decodedMessage);
                        }
                        else if (decodedMessage.type == 15) {
                            // VDSM_NOTIFICATION_CALL_SCENE = 15;
                            if (decodedMessage.vdsmSendCallScene) {
                                this.emitObject("VDSM_NOTIFICATION_CALL_SCENE", decodedMessage.vdsmSendCallScene);
                            }
                        }
                        else if (decodedMessage.type == 16) {
                            // VDSM_NOTIFICATION_SAVE_SCENE = 16;
                            if (decodedMessage.vdsmSendSaveScene) {
                                this.emitObject("VDSM_NOTIFICATION_SAVE_SCENE", decodedMessage.vdsmSendSaveScene);
                            }
                        }
                        else if (decodedMessage.type == 17) {
                            // VDSM_NOTIFICATION_UNDO_SCENE = 17;
                        }
                        else if (decodedMessage.type == 21) {
                            // VDSM_NOTIFICATION_SET_CONTROL_VALUE
                            if (decodedMessage.vdsmSendSetControlValue) {
                                this.emitObject("VDSM_NOTIFICATION_SET_CONTROL_VALUE", decodedMessage.vdsmSendSetControlValue);
                            }
                        }
                        else if (decodedMessage.type == 25) {
                            // VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE
                            if (decodedMessage.vdsmSendOutputChannelValue) {
                                this.emitObject("VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE", decodedMessage.vdsmSendOutputChannelValue);
                            }
                        }
                    }
                    catch (err) {
                        console.error(err);
                    }
                };
                const onConnClose = () => {
                    if (this.debug)
                        console.log("connection from %s closed", remoteAddress);
                };
                const onConnError = (err) => {
                    if (this.debug)
                        console.log("Connection %s error: %s", remoteAddress, err.message);
                };
                conn.on("data", onConnData);
                conn.once("close", onConnClose);
                conn.on("error", onConnError);
                this.on("vdcSendPushProperty", (message) => {
                    this._vdcSendPushProperty(conn, message);
                });
                this.on("vdcPushChannelStates", (answerBuf) => {
                    this._vdcPushChannelStates(conn, answerBuf);
                });
                this.on("vdcAnnounceDevices", () => {
                    if (this.devices && this.devices.length > 0) {
                        this.devices.forEach((dev) => {
                            if (dev.dSUID && dev.dSUID.length > 0) {
                                this._vdcSendAnnounceDevice(conn, dev.dSUID);
                            }
                        });
                    }
                });
            };
            const server = net.createServer();
            server.on("connection", handleConnection);
            server.listen({ port: this.config.port }, () => {
                if (this.debug)
                    console.log("server listening to %j", server.address());
            });
            // advertise server
            this._initDNSSD();
            setImmediate(() => {
                /**
                 * @event vdcRunningState - Sent when the VDC is fully initialized
                 */
                this.emitObject("vdcRunningState", { running: true });
            });
            console.log(`VDC initialized on port ${this.config.port} and running`);
            return { error: 0, text: `VDC initialized on port ${this.config.port} and running` };
        });
    }
    _initDNSSD() {
        const serviceType = new dnssd.ServiceType("_ds-vdc._tcp");
        if (this.debug)
            console.log(serviceType);
        const ad = new dnssd.Advertisement(serviceType, this.config.port, {
            name: this.config.vdcName,
            txt: { dSUID: this.config.vdcDSUID },
        });
        ad.start()
            .on("error", (err) => {
            if (this.debug)
                console.log("Error:", err);
        })
            .on("stopped", (stop) => {
            if (this.debug)
                console.log("Stopped", stop);
        })
            .on("instanceRenamed", (instanceRenamed) => {
            if (this.debug)
                console.log("instanceRenamed", instanceRenamed);
        })
            .on("hostRenamed", (hostRenamed) => {
            if (this.debug)
                console.log("hostRenamed", hostRenamed);
        });
    }
    /**
     * Parse genericResponse to show errors
     * @param {Object} decodedMessage
     */
    _parseGenericResponse(decodedMessage) {
        const errorMapping = {
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
            ERR_NOT_AUTHORIZED: "The caller is not authorized with the Native Device",
        };
        if (decodedMessage &&
            decodedMessage.genericResponse &&
            decodedMessage.genericResponse.code) {
            if (this.debug) {
                const code = decodedMessage.genericResponse.code;
                console.info(`Generic response with message ${errorMapping[code]} received`);
            }
        }
    }
}
exports.libdsvdc = libdsvdc;
//# sourceMappingURL=libdsvdc.js.map