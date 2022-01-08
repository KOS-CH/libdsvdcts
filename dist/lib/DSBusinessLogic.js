"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSBusinessLogic = void 0;
const messageMapping_1 = require("./messageMapping");
class DSBusinessLogic {
    constructor(config) {
        this.events = config.events;
        this.devices = config.devices;
        this.vdsm = config.vdsm;
        this.outputChannelBuffer = [];
        this.events.on('binaryInputStateRequest', this.binaryInputStateRequest.bind(this));
        this.events.on('sensorStatesRequest', this.sensorStatesRequest.bind(this));
        this.events.on('VDSM_NOTIFICATION_SET_CONTROL_VALUE', this.vdsmNotificationSetControlValue.bind(this));
        this.events.on('VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE', this.vdsmNotificationSetOutputChannelValue.bind(this));
        this.events.on('VDSM_NOTIFICATION_SAVE_SCENE', this.vdsmNotificationSaveScene.bind(this));
        this.events.on('VDSM_NOTIFICATION_CALL_SCENE', this.vdsmNotificationCallScene.bind(this));
        this.events.on('channelStatesRequest', this.channelStatesRequest.bind(this));
    }
    binaryInputStateRequest(msg) {
        this.events.log('debug', `received request for binaryInputStateRequest ${JSON.stringify(msg)}`);
        if (msg && msg.dSUID) {
            const affectedDevice = this.devices.find((d) => d.dSUID.toLowerCase() == msg.dSUID.toLowerCase());
            this.events.log('debug', `found device ${JSON.stringify(affectedDevice)}`);
            if (affectedDevice) {
                const inputStates = [];
                affectedDevice.binaryInputDescriptions.forEach((i) => {
                    inputStates.push({
                        name: i.objName,
                        age: 1,
                        value: null,
                    });
                });
                this._sendBinaryInputState(inputStates, msg.messageId);
            }
        }
    }
    sensorStatesRequest(msg) {
        if (msg && msg.dSUID) {
            const affectedDevice = this.devices.find((d) => d.dSUID.toLowerCase() == msg.dSUID.toLowerCase());
            if (affectedDevice) {
                const getStates = [];
                let key;
                let value;
                for ([key, value] of Object.entries(affectedDevice.watchStateIDs)) {
                    let stateObj = {};
                    stateObj[key] = value;
                    getStates.push(stateObj);
                }
                if (getStates && getStates.length > 0) {
                    const handleCallback = (stateObj) => {
                        if (stateObj) {
                            const sensorStates = [];
                            let key;
                            let state;
                            for ([key, state] of Object.entries(stateObj)) {
                                this.events.log('debug', 'msg value from state: ' + JSON.stringify(state));
                                if (affectedDevice.modifiers &&
                                    typeof affectedDevice.modifiers == 'object' &&
                                    key &&
                                    affectedDevice.modifiers[key]) {
                                    state.val =
                                        state.val *
                                            parseFloat(affectedDevice.modifiers[key]);
                                }
                                sensorStates.push({
                                    name: key,
                                    age: 1,
                                    value: state.val,
                                });
                            }
                            this._sendSensorStatesRequest(sensorStates, msg.messageId);
                        }
                    };
                    this.events.emitGetState(getStates, handleCallback.bind(this));
                }
            }
        }
    }
    channelStatesRequest(msg) {
        this.events.log('debug', `received request for status ${JSON.stringify(msg)}`);
        if (msg && msg.dSUID) {
            const affectedDevice = this.devices.find((d) => d.dSUID.toLowerCase() == msg.dSUID.toLowerCase());
            this.events.log('debug', 'FOUND DEVICE: ' + JSON.stringify(affectedDevice));
            if (affectedDevice) {
                const getStates = [];
                if (msg && msg.names && msg.names.length > 0) {
                    msg.names.forEach((e) => {
                        const updateStateId = Object.keys(affectedDevice.watchStateIDs).find(key => affectedDevice.watchStateIDs[key] === e);
                        if (updateStateId) {
                            let stateObj = {};
                            stateObj[e] = affectedDevice.watchStateIDs[e];
                            getStates.push(stateObj);
                        }
                    });
                }
                else {
                    let key;
                    let value;
                    for ([key, value] of Object.entries(affectedDevice.watchStateIDs)) {
                        let stateObj = {};
                        stateObj[key] = value;
                        getStates.push(stateObj);
                    }
                }
                if (getStates && getStates.length > 0) {
                    const handleCallback = (stateObj) => {
                        if (stateObj) {
                            this.events.log('debug', JSON.stringify(stateObj));
                            const elements = [];
                            let key;
                            let value;
                            for ([key, value] of Object.entries(stateObj)) {
                                let valueObj = {};
                                this.events.log('debug', `channelState value detection: ${typeof value.val}`);
                                if (typeof value.val == 'boolean') {
                                    valueObj.vBool = value.val;
                                }
                                else if (typeof value.val == 'number') {
                                    valueObj.vDouble = value.val;
                                }
                                elements.push({
                                    name: key,
                                    elements: [
                                        { name: 'age', value: { vDouble: 1 } },
                                        { name: 'error', value: { vUint64: '0' } },
                                        { name: 'value', value: valueObj },
                                    ],
                                });
                            }
                            this._sendComplexState(msg.messageId, elements);
                        }
                    };
                    this.events.emitGetState(getStates, handleCallback.bind(this));
                }
            }
        }
    }
    vdsmNotificationCallScene() { }
    vdsmNotificationSaveScene() { }
    vdsmNotificationSetOutputChannelValue(msg) {
        this.events.log('debug', `received OUTPUTCHANNELVALUE value ${JSON.stringify(msg)}`);
        if (msg && msg.dSUID) {
            msg.dSUID.forEach((id) => {
                const affectedDevice = this.devices.find((d) => d.dsConfig.dSUID.toLowerCase() == id.toLowerCase());
                if (affectedDevice) {
                    const affectedState = affectedDevice.watchStateID[msg.channelId];
                    if (affectedState) {
                        let myOutputChannelBuffer = this.outputChannelBuffer.find(b => b.dSUID == msg.dSUID);
                        if (!myOutputChannelBuffer) {
                            myOutputChannelBuffer = {
                                dSUID: msg.dSUID,
                                buffer: [],
                            };
                            this.outputChannelBuffer.push(myOutputChannelBuffer);
                        }
                        myOutputChannelBuffer.buffer.push({
                            name: msg.channelId,
                            state: affectedState,
                            value: msg.value,
                        });
                        if (msg.applyNow) {
                            if (Object.keys(affectedDevice.watchStateIDs).includes('rgb') &&
                                myOutputChannelBuffer.buffer.find(b => b.name == 'saturation') &&
                                myOutputChannelBuffer.buffer.find(b => b.name == 'hue') &&
                                myOutputChannelBuffer.buffer.find(b => b.name == 'brightness')) {
                                this.events.log('debug', 'colorupdate and we have found an rgb watchState');
                                const sat = myOutputChannelBuffer.buffer.find(b => b.name == 'saturation');
                                const hue = myOutputChannelBuffer.buffer.find(b => b.name == 'hue');
                                const brightness = myOutputChannelBuffer.buffer.find(b => b.name == 'brightness');
                                if (sat && hue && brightness) {
                                    this.events.log('debug', `Hue: ${hue.value} Saturation: ${sat.value} Brightness: ${brightness.value}`);
                                    const rgb = rgbhelper.hsvTOrgb(hue.value, sat.value, brightness.value);
                                    const rgbHex = rgbhelper.rgbTOhex(rgb);
                                    this.events.log('debug', `Calculated rgb in hex: ${rgbHex}`);
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    vdsmNotificationSetControlValue(msg) {
        this.events.log('debug', 'CONTROLVALUE RECEIVED ' + JSON.stringify(msg));
        if (msg && msg.name) {
            if (msg && msg.dSUID) {
                msg.dSUID.forEach((id) => {
                    const affectedDevice = this.devices.find((d) => d.dSUID.toLowerCase() == id.toLowerCase());
                    if (affectedDevice &&
                        msg.name !== 'TemperatureOutside' &&
                        msg.name !== 'BrightnessOutside') {
                        const updateStateId = Object.keys(affectedDevice.watchStateIDs).find(key => affectedDevice.watchStateIDs[key] === msg.channelId);
                        if (updateStateId) {
                            this.events.emitSetState(affectedDevice.watchStateIDs[updateStateId], msg.value, false, (error) => {
                                if (error) {
                                    console.error(`Failed to set ${affectedDevice.watchStateIDs[updateStateId]} on device ${JSON.stringify(affectedDevice)} to value ${msg.value} with error ${error}`);
                                }
                            });
                        }
                    }
                    else if (msg.name === 'TemperatureOutside') {
                        this.events.log('debug', 'SET STATE for TemperatureOutside');
                        this.events.emitSetState('DS-Devices.outdoorValues.temperature', msg.value, true, (error) => {
                            if (error)
                                this.events.log('error', `Failed setting DS-Devices.outdoorValues.temperature to value ${msg.value} with error ${error}`);
                        });
                    }
                    else if (msg.name === 'BrightnessOutside') {
                        this.events.emitSetState('DS-Devices.outdoorValues.brightness', msg.value, true, (error) => {
                            if (error)
                                this.events.log('error', `Failed setting DS-Devices.outdoorValues.brightness to value ${msg.value} with error ${error}`);
                        });
                    }
                });
            }
        }
    }
    _sendComplexState(messageId, rawSubElements) {
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
        this.events.log('debug', JSON.stringify({
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
        this.events.log('debug', JSON.stringify(this.vdsm.decode(answerBuf)));
        this.events.emitObject('vdcPushChannelStates', answerBuf);
        this.events.emitObject('messageSent', this.vdsm.decode(answerBuf));
    }
    _sendSensorStatesRequest(sensorStates, messageId) {
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
            this.events.log('debug', JSON.stringify({
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
            this.events.log('debug', JSON.stringify(this.vdsm.decode(answerBuf)));
            this.events.emitObject('vdcPushChannelStates', answerBuf);
            this.events.emitObject('messageSent', this.vdsm.decode(answerBuf));
        }
    }
    _sendBinaryInputState(inputStates, messageId) {
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
            this.events.log('debug', JSON.stringify({
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
            this.events.log('debug', JSON.stringify(this.vdsm.decode(answerBuf)));
            this.events.emitObject('vdcPushChannelStates', answerBuf);
            this.events.emitObject('messageSent', this.vdsm.decode(answerBuf));
        }
    }
}
exports.DSBusinessLogic = DSBusinessLogic;
//# sourceMappingURL=DSBusinessLogic.js.map