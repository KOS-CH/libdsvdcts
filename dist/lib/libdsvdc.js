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
const messageMapping_1 = require("./messageMapping");
const DSBusinessLogic_1 = require("./DSBusinessLogic");
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
        this._vdcResponseGetProperty = dsCommunication_1._vdcResponseGetProperty;
        this.config = config;
        this.debug = config.debug;
        this.messageId = 0;
        this.messagePath = path.join(__dirname, '/messages/messages.proto');
        this.root = protobuf.loadSync(this.messagePath);
        this.vdsm = this.root.lookupType('Message');
        this.VERSION = '0.0.1';
        this.MODEL = 'ioBroker VDC';
        this.VENDORNAME = 'KYUKA';
    }
    start(config, devices = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!config.vdcDSUID || config.vdcDSUID.length != 34) {
                return { error: 99, text: 'vdcDSUID missing' };
            }
            else {
                this.config.vdcDSUID = config.vdcDSUID;
            }
            if (!config.vdcName || config.vdcName.length <= 0) {
                return { error: 99, text: 'vdcName missing' };
            }
            else {
                this.config.vdcName = config.vdcName;
            }
            if (!config.port) {
                this.config.port = yield (0, libdsutil_1.getFreePort)();
                if (this.debug)
                    console.log('No port provided -> using %d', this.config.port);
            }
            else {
                this.config.port = config.port;
            }
            this.devices = devices;
            const handleConnection = (conn) => {
                let remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
                if (this.debug)
                    console.log('new client connection from %s', remoteAddress);
                const onConnData = (d) => {
                    if (this.debug)
                        console.log('\n---------------------------\nconnection data from %s: %j', remoteAddress, d);
                    try {
                        let decodedMessage;
                        decodedMessage = this.vdsm.decode(d.slice(2));
                        this.emitObject('messageReceived', decodedMessage);
                        if (this.debug)
                            console.log(JSON.stringify(decodedMessage));
                        if (decodedMessage.type == 2) {
                            this._vdsmResponseHello(conn, decodedMessage);
                            this._vdcSendAnnounceVdc(conn);
                        }
                        else if (decodedMessage.type == 8) {
                            this._vdcSendPong(conn, decodedMessage);
                        }
                        else if (decodedMessage.type == 4) {
                            this._vdcResponseGetProperty(conn, decodedMessage);
                        }
                        else if (decodedMessage.type == 6) {
                            const device = this.devices.find((d) => d.dSUID.toLowerCase() ==
                                decodedMessage.vdsmRequestSetProperty.dSUID.toLowerCase());
                            if (this.debug)
                                console.log('DEVICE TO UPDATE FOUND', JSON.stringify(device));
                            if (device) {
                                if (decodedMessage.vdsmRequestSetProperty.properties[0].name ==
                                    'zoneID') {
                                    device.zoneID =
                                        decodedMessage.vdsmRequestSetProperty.properties[0].value.vUint64.toString() ||
                                            65534;
                                    this.emitObject('deviceZoneChange', {
                                        request: decodedMessage.vdsmRequestSetProperty,
                                        devices: this.devices,
                                    });
                                }
                                else {
                                    if (this.debug)
                                        console.log('DEVICE BEFORE UPDATE', JSON.stringify(device));
                                    decodedMessage.vdsmRequestSetProperty.properties.forEach((p) => {
                                        if (device[p.name]) {
                                            if (this.debug)
                                                console.log(`found parameters ${p.name} to upgrade in ${JSON.stringify(device)}`);
                                            p.elements.forEach((el) => {
                                                const valueObj = device[p.name].find((o) => o.objName == el.name);
                                                if (this.debug)
                                                    console.log(`Found parameter ${el.name} in object ${JSON.stringify(valueObj)} in device`);
                                                if (valueObj) {
                                                    el.elements.forEach((ce) => {
                                                        let newValue = '';
                                                        Object.keys(ce.value).forEach(v => {
                                                            newValue = ce.value[v];
                                                        });
                                                        if (this.debug)
                                                            console.log(`setting value ${newValue} on ${JSON.stringify(valueObj)} on parameter ${ce.name}`);
                                                        valueObj[ce.name] = newValue.toString();
                                                    });
                                                }
                                            });
                                        }
                                        if (this.debug)
                                            console.log('DEVICE AFTER UPDATE', JSON.stringify(device));
                                        this.emitObject('updateDeviceValues', device);
                                    });
                                }
                            }
                            this._genericResponse(conn, { code: 0, description: 'OK' }, decodedMessage.messageId);
                        }
                        else if (decodedMessage.type == 1) {
                            this._parseGenericResponse(decodedMessage);
                        }
                        else if (decodedMessage.type == 15) {
                            if (decodedMessage.vdsmSendCallScene) {
                                this.emitObject('VDSM_NOTIFICATION_CALL_SCENE', decodedMessage.vdsmSendCallScene);
                            }
                        }
                        else if (decodedMessage.type == 16) {
                            if (decodedMessage.vdsmSendSaveScene) {
                                this.emitObject('VDSM_NOTIFICATION_SAVE_SCENE', decodedMessage.vdsmSendSaveScene);
                            }
                        }
                        else if (decodedMessage.type == 17) {
                        }
                        else if (decodedMessage.type == 21) {
                            if (decodedMessage.vdsmSendSetControlValue) {
                                this.emitObject('VDSM_NOTIFICATION_SET_CONTROL_VALUE', decodedMessage.vdsmSendSetControlValue);
                            }
                        }
                        else if (decodedMessage.type == 25) {
                            if (decodedMessage.vdsmSendOutputChannelValue) {
                                this.emitObject('VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE', decodedMessage.vdsmSendOutputChannelValue);
                            }
                        }
                    }
                    catch (err) {
                        console.error(err);
                    }
                };
                const onConnClose = () => {
                    if (this.debug)
                        console.log('connection from %s closed', remoteAddress);
                };
                const onConnError = (err) => {
                    if (this.debug)
                        console.log('Connection %s error: %s', remoteAddress, err.message);
                };
                conn.on('data', onConnData);
                conn.once('close', onConnClose);
                conn.on('error', onConnError);
                this.on('vdcSendPushProperty', message => {
                    this._vdcSendPushProperty(conn, message);
                });
                this.on('vdcPushChannelStates', answerBuf => {
                    this._vdcPushChannelStates(conn, answerBuf);
                });
                this.on('vdcAnnounceDevices', () => {
                    if (this.devices && this.devices.length > 0) {
                        this.devices.forEach((dev) => {
                            if (dev.dSUID && dev.dSUID.length > 0) {
                                this._vdcSendAnnounceDevice(conn, dev.dSUID);
                            }
                        });
                    }
                });
            };
            new DSBusinessLogic_1.DSBusinessLogic({ events: this, devices: this.devices, vdsm: this.vdsm });
            const server = net.createServer();
            server.on('connection', handleConnection);
            server.listen({ port: this.config.port }, () => {
                if (this.debug)
                    console.log('server listening to %j', server.address());
            });
            this._initDNSSD();
            setImmediate(() => {
                this.emitObject('vdcRunningState', { running: true });
            });
            console.log(`VDC initialized on port ${this.config.port} and running`);
            return {
                error: 0,
                text: `VDC initialized on port ${this.config.port} and running`,
            };
        });
    }
    _initDNSSD() {
        const serviceType = new dnssd.ServiceType('_ds-vdc._tcp');
        if (this.debug)
            console.log(serviceType);
        const ad = new dnssd.Advertisement(serviceType, this.config.port, {
            name: this.config.vdcName,
            txt: { dSUID: this.config.vdcDSUID },
        });
        ad.start()
            .on('error', err => {
            if (this.debug)
                console.log('Error:', err);
        })
            .on('stopped', stop => {
            if (this.debug)
                console.log('Stopped', stop);
        })
            .on('instanceRenamed', instanceRenamed => {
            if (this.debug)
                console.log('instanceRenamed', instanceRenamed);
        })
            .on('hostRenamed', hostRenamed => {
            if (this.debug)
                console.log('hostRenamed', hostRenamed);
        });
    }
    _parseGenericResponse(decodedMessage) {
        const errorMapping = {
            ERR_OK: 'Everything alright',
            ERR_MESSAGE_UNKNOWN: 'The message id is unknown. This might happen due to incomplete or incompatible implementation',
            ERR_INCOMPATIBLE_API: 'The API version of the VDSM is not compatible with this VDC.',
            ERR_SERVICE_NOT_AVAILABLE: 'The VDC cannot respond. Might happen bcause the VDC is already connected to another VDSM.',
            ERR_INSUFFICIENT_STORAGE: 'The VDC could not store the related data.',
            ERR_FORBIDDEN: 'ERR_FORBIDDEN 5 The call is not allowed.',
            ERR_NOT_IMPLEMENTED: 'Not (yet) implemented.',
            ERR_NO_CONTENT_FOR_ARRAY: 'Array data was expected.',
            ERR_INVALID_VALUE_TYPE: 'Invalid data type',
            ERR_MISSING_SUBMESSAGE: 'Submessge was expected.',
            ERR_MISSING_DATA: 'Additional data was exptected.',
            ERR_NOT_FOUND: 'Addredded entity or object was not found.',
            ERR_NOT_AUTHORIZED: 'The caller is not authorized with the Native Device',
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
    sendUpdate(dSUID, obj) {
        this.emitObject('vdcSendPushProperty', { dSUID, obj });
    }
    sendState(stateValue, messageId) {
        const properties = [];
        const subElements = (0, messageMapping_1.createSubElements)({
            0: { age: 1, value: stateValue },
        });
        properties.push({
            name: 'channelStates',
            elements: subElements,
        });
        console.log(JSON.stringify({
            type: 5,
            messageId: messageId,
            vdcResponseGetProperty: { properties },
        }));
        const answerObj = this.vdsm.fromObject({
            type: 5,
            messageId: messageId,
            vdcResponseGetProperty: { properties },
        });
        const answerBuf = this.vdsm.encode(answerObj).finish();
        if (this.debug)
            console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
        this.emitObject('vdcPushChannelStates', answerBuf);
        this.emitObject('messageSent', this.vdsm.decode(answerBuf));
    }
    sendComplexState(messageId, rawSubElements) {
        const properties = [];
        if (rawSubElements instanceof Array) {
            properties.push({
                name: 'channelStates',
                elements: rawSubElements,
            });
        }
        else {
            properties.push({
                name: 'channelStates',
                elements: [rawSubElements],
            });
        }
        console.log(JSON.stringify({
            type: 5,
            messageId: messageId,
            vdcResponseGetProperty: { properties },
        }));
        const answerObj = this.vdsm.fromObject({
            type: 5,
            messageId: messageId,
            vdcResponseGetProperty: { properties },
        });
        const answerBuf = this.vdsm.encode(answerObj).finish();
        if (this.debug)
            console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
        this.emitObject('vdcPushChannelStates', answerBuf);
        this.emitObject('messageSent', this.vdsm.decode(answerBuf));
    }
    sendSensorStatesRequest(sensorStates, messageId) {
        const properties = [];
        const elements = [];
        if (sensorStates && sensorStates.length > 0) {
            sensorStates.forEach((i) => {
                const subElements = (0, messageMapping_1.createSubElements)({
                    age: i.age,
                    error: 0,
                    value_boolean: i.value,
                    extendedValue: null,
                });
                elements.push({
                    name: i.name,
                    elements: subElements,
                });
            });
            properties.push({
                name: 'channelStates',
            });
            properties.push({
                name: 'sensorStates',
                elements: elements,
            });
            console.log(JSON.stringify({
                type: 5,
                messageId: messageId,
                vdcResponseGetProperty: { properties },
            }));
            const answerObj = this.vdsm.fromObject({
                type: 5,
                messageId: messageId,
                vdcResponseGetProperty: { properties },
            });
            const answerBuf = this.vdsm.encode(answerObj).finish();
            if (this.debug)
                console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
            this.emitObject('vdcPushChannelStates', answerBuf);
            this.emitObject('messageSent', this.vdsm.decode(answerBuf));
        }
    }
    sendBinaryInputState(inputStates, messageId) {
        const properties = [];
        const elements = [];
        if (inputStates && inputStates.length > 0) {
            inputStates.forEach((i) => {
                const subElements = (0, messageMapping_1.createSubElements)({
                    age: i.age,
                    error: 0,
                    value_boolean: i.value,
                    extendedValue: null,
                });
                elements.push({
                    name: i.name,
                    elements: subElements,
                });
            });
            properties.push({
                name: 'binaryInputStates',
                elements: elements,
            });
            console.log(JSON.stringify({
                type: 5,
                messageId: messageId,
                vdcResponseGetProperty: { properties },
            }));
            const answerObj = this.vdsm.fromObject({
                type: 5,
                messageId: messageId,
                vdcResponseGetProperty: { properties },
            });
            const answerBuf = this.vdsm.encode(answerObj).finish();
            if (this.debug)
                console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
            this.emitObject('vdcPushChannelStates', answerBuf);
            this.emitObject('messageSent', this.vdsm.decode(answerBuf));
        }
    }
    sendVanish(dSUID) {
        const properties = [];
        this.messageId = this.messageId + 1;
        properties.push({
            dSUID: dSUID,
        });
        const answerObj = this.vdsm.fromObject({
            type: 11,
            messageId: this.messageId,
            vdcSendVanish: { properties },
        });
        const answerBuf = this.vdsm.encode(answerObj).finish();
        if (this.debug)
            console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
        this.emitObject('vdcPushChannelStates', answerBuf);
        this.emitObject('messageSent', this.vdsm.decode(answerBuf));
    }
}
exports.libdsvdc = libdsvdc;
//# sourceMappingURL=libdsvdc.js.map