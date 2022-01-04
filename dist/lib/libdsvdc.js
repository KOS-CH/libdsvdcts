"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.libdsvdc = void 0;
const DSEventEmitter_1 = require("./DSEventEmitter");
const libdsutil_1 = require("./libdsutil");
const net_1 = __importDefault(require("net"));
const dnssd_1 = __importDefault(require("dnssd"));
const path_1 = __importDefault(require("path"));
const protobufjs_1 = __importDefault(require("protobufjs"));
const messagePath = path_1.default.join(__dirname, "/messages/messages.proto");
const root = protobufjs_1.default.loadSync(messagePath);
const vdsm = root.lookupType("Message");
class libdsvdc extends DSEventEmitter_1.DSEventEmitter {
    constructor(config) {
        super(config);
        this.config = config;
        this.debug = config.debug;
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
                conn.on("data", onConnData);
                conn.once("close", onConnClose);
                conn.on("error", onConnError);
                this.on("vdcSendPushProperty", function (obj) {
                    this._vdcSendPushProperty(conn, obj, obj);
                });
                this.on("vdcPushChannelStates", function (answerBuf) {
                    this._vdcPushChannelStates(conn, answerBuf);
                });
                this.on("vdcAnnounceDevices", function () {
                    if (this.devices && this.devices.length > 0) {
                        this.devices.forEach((dev) => {
                            if (dev.dSUID && dev.dSUID.length > 0) {
                                this._vdcSendAnnounceDevice(conn, dev.dSUID);
                            }
                        });
                    }
                });
                function onConnData(d) {
                    if (this.debug)
                        console.log("\n---------------------------\nconnection data from %s: %j", remoteAddress, d);
                    try {
                        const decodedMessage = vdsm.decode(d.slice(2));
                        /**
                         * @event messageReceived - New message received from VDSM
                         * @type {Object}
                         * @property Message Object
                         */
                        self.emitObject("messageReceived", decodedMessage);
                        if (self.debug)
                            console.log(JSON.stringify(decodedMessage));
                        let answerBuf = null;
                        if (decodedMessage.type == 2) {
                            // VDSM_REQUEST_HELLO
                            // send RESPONSE HELLO
                            self._vdsmResponseHello(conn, decodedMessage);
                            // send vdcAnnounceVdc
                            self._vdcSendAnnounceVdc(conn);
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
                            self._vdcSendPong(conn, decodedMessage);
                        }
                        else if (decodedMessage.type == 4) {
                            // VDSM_REQUESTGETPROPERTIES
                            // send _vdcResponseGetProperty
                            self._vdcResponseGetProperty(conn, decodedMessage);
                        }
                        else if (decodedMessage.type == 6) {
                            // VDSM_SETPROPERTY
                            // TODO implement logic
                            // search for device and store the zone there
                            const device = self.devices.find((d) => d.dSUID.toLowerCase() ==
                                decodedMessage.vdsmRequestSetProperty.dSUID.toLowerCase());
                            if (device) {
                                // device found
                                device.zoneID =
                                    decodedMessage.vdsmRequestSetProperty.properties[0].value
                                        .vUint64 || 65534;
                                self.emitObject("deviceZoneChange", {
                                    request: decodedMessage.vdsmRequestSetProperty,
                                    devices: self.devices,
                                });
                            }
                            self._genericResponse(conn, { code: 0, description: "OK" }, decodedMessage.messageId);
                        }
                        else if (decodedMessage.type == 1) {
                            self._parseGenericResponse(decodedMessage);
                        }
                        else if (decodedMessage.type == 15) {
                            // VDSM_NOTIFICATION_CALL_SCENE = 15;
                            if (decodedMessage.vdsmSendCallScene) {
                                self.emitObject("VDSM_NOTIFICATION_CALL_SCENE", decodedMessage.vdsmSendCallScene);
                            }
                        }
                        else if (decodedMessage.type == 16) {
                            // VDSM_NOTIFICATION_SAVE_SCENE = 16;
                            if (decodedMessage.vdsmSendSaveScene) {
                                self.emitObject("VDSM_NOTIFICATION_SAVE_SCENE", decodedMessage.vdsmSendSaveScene);
                            }
                        }
                        else if (decodedMessage.type == 17) {
                            // VDSM_NOTIFICATION_UNDO_SCENE = 17;
                        }
                        else if (decodedMessage.type == 21) {
                            // VDSM_NOTIFICATION_SET_CONTROL_VALUE
                            if (decodedMessage.vdsmSendSetControlValue) {
                                self.emitObject("VDSM_NOTIFICATION_SET_CONTROL_VALUE", decodedMessage.vdsmSendSetControlValue);
                            }
                        }
                        else if (decodedMessage.type == 25) {
                            // VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE
                            if (decodedMessage.vdsmSendOutputChannelValue) {
                                self.emitObject("VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE", decodedMessage.vdsmSendOutputChannelValue);
                            }
                        }
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
                function onConnClose() {
                    if (self.debug)
                        console.log("connection from %s closed", remoteAddress);
                }
                function onConnError(err) {
                    if (self.debug)
                        console.log("Connection %s error: %s", remoteAddress, err.message);
                }
            };
            const server = net_1.default.createServer();
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
        const serviceType = new dnssd_1.default.ServiceType("_ds-vdc._tcp");
        if (this.debug)
            console.log(serviceType);
        const ad = new dnssd_1.default.Advertisement(serviceType, this.config.port, {
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
}
exports.libdsvdc = libdsvdc;
//# sourceMappingURL=libdsvdc.js.map