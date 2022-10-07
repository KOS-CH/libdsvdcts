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
            if (affectedDevice && affectedDevice.binaryInputDescriptions) {
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
                        try {
                            if (stateObj) {
                                const inputStates = [];
                                let key;
                                let state;
                                for ([key, state] of Object.entries(stateObj)) {
                                    this.events.log('debug', 'msg value from state: ' + JSON.stringify(state));
                                    if (state) {
                                        inputStates.push({
                                            name: key,
                                            age: 1,
                                            value: state.val,
                                        });
                                    }
                                    else {
                                        inputStates.push({
                                            name: key,
                                            age: 1,
                                            value: false,
                                        });
                                    }
                                }
                                this._sendBinaryInputState(inputStates, msg.messageId);
                            }
                        }
                        catch (err) {
                            this.events.log('warn', `there was an issue retrieving your state(s) ${JSON.stringify(getStates)} on device ${affectedDevice}: failed with error ${err}`);
                        }
                    };
                    this.events.emitGetState(getStates, handleCallback.bind(this));
                }
            }
        }
    }
    sensorStatesRequest() { }
    channelStatesRequest(msg) {
        this.events.log('debug', `received request for channelState ${JSON.stringify(msg)}`);
        if (msg && msg.dSUID) {
            const affectedDevice = this.devices.find((d) => d.dSUID.toLowerCase() == msg.dSUID.toLowerCase());
            this.events.log('debug', 'FOUND DEVICE: ' + JSON.stringify(affectedDevice));
            if (affectedDevice) {
                const getStates = [];
                if (msg && msg.names && msg.names.length > 0) {
                    this.events.log('debug', `get channelStates with names: ${JSON.stringify(msg.names)}`);
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
                    this.events.log('debug', `names was empty in the channelstate request: affectedDevice ${JSON.stringify(affectedDevice)}`);
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
                        try {
                            if (stateObj) {
                                this.events.log('debug', `channelStates stateObj: ${JSON.stringify(stateObj)}`);
                                let elements = [];
                                let key;
                                let value;
                                for ([key, value] of Object.entries(stateObj)) {
                                    let valueObj = {};
                                    if (!value) {
                                        value = {};
                                        value.val = false;
                                    }
                                    this.events.log('debug', `channelState value detection: ${typeof value.val}`);
                                    if (msg && msg.names && msg.names.length > 0) {
                                        this.events.log('debug', 'names in channelState request was full -> normal processing');
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
                                    else {
                                        this.events.log('debug', 'names in channelState request was empty -> breakout for flat elements array');
                                        if (value.val) {
                                            value.val = 100;
                                        }
                                        else {
                                            value.val = 0;
                                        }
                                        const subElements = (0, messageMapping_1.createSubElements)({
                                            0: { age: 1, value: value.val },
                                        });
                                        elements = subElements;
                                        this.events.log('debug', `empty names channelstate: ${JSON.stringify(elements)}`);
                                    }
                                }
                                this._sendComplexState(msg.messageId, elements);
                            }
                        }
                        catch (err) {
                            this.events.log('warn', `there was an issue retrieving your state(s) ${JSON.stringify(getStates)} on device ${affectedDevice}: failed with error ${err}`);
                        }
                    };
                    this.events.emitGetState(getStates, handleCallback.bind(this));
                }
            }
            else {
            }
        }
    }
    vdsmNotificationCallScene(msg) {
        this.events.log('debug', `received call scene event ${JSON.stringify(msg)}`);
        if (msg && msg.dSUID) {
            msg.dSUID.forEach((id) => {
                const affectedDevice = this.devices.find((d) => d.dSUID.toLowerCase() == id.toLowerCase());
                if (affectedDevice && affectedDevice.scenes) {
                    const storedScene = affectedDevice.scenes.find((s) => {
                        return s.sceneId == msg.scene;
                    });
                    if (storedScene) {
                        if (!storedScene.values.dontCare) {
                            let key;
                            let value;
                            this.events.log('debug', `looping the values inside scene ${msg.scene} -> ${JSON.stringify(storedScene)}`);
                            for ([key, value] of Object.entries(storedScene.values)) {
                                this.events.log('debug', `performing update on state: ${key} ${JSON.stringify(affectedDevice.watchStateIDs)} with key ${key} value ${value.value}`);
                                this.events.log('debug', `setting ${value.value} of ${affectedDevice.name} to on ${affectedDevice.watchStateIDs[key]}`);
                                this.events.emitSetState(affectedDevice.watchStateIDs[key], value.value, false, (error) => {
                                    if (error) {
                                        this.events.log('error', `Failed to set ${affectedDevice.watchStateIDs[key]} on device ${JSON.stringify(affectedDevice)} to value ${value.value} with error ${error}`);
                                    }
                                });
                            }
                        }
                    }
                    else {
                        const switchState = affectedDevice.watchStateIDs['switch'];
                        this.events.log('debug', `no stored scene found -> executing some default sets - scene: ${msg.scene} switchState: ${switchState}`);
                        if (switchState) {
                            this._performDefaultScenesSet(msg, switchState, affectedDevice);
                        }
                        else {
                            this.events.log('debug', `no switch state found in ${JSON.stringify(affectedDevice)} for scene ${msg.scene}`);
                        }
                    }
                }
                else if (affectedDevice) {
                    const switchState = affectedDevice.watchStateIDs['switch'];
                    if (switchState)
                        this._performDefaultScenesSet(msg, switchState, affectedDevice);
                }
            });
        }
    }
    _performDefaultScenesSet(msg, switchState, affectedDevice) {
        switch (msg.scene) {
            case 0:
                this.events.emitSetState(switchState, false, false, (error) => {
                    if (error) {
                        this.events.log('error', `Failed to set ${switchState} on device ${JSON.stringify(affectedDevice)} to false with error ${error}`);
                    }
                });
                break;
            case 13:
                this.events.log('debug', `no stored scene found -> executing some default sets - scene: ${msg.scene} switchState: ${switchState} - matching minium scene 13`);
                this.events.emitSetState(switchState, false, false, (error) => {
                    if (error) {
                        this.events.log('error', `Failed to set ${switchState} on device ${JSON.stringify(affectedDevice)} to false with error ${error}`);
                    }
                });
                break;
            case 14:
                this.events.log('debug', `no stored scene found -> executing some default sets - scene: ${msg.scene} switchState: ${switchState} - matching maximum scene 14`);
                this.events.emitSetState(switchState, true, false, (error) => {
                    if (error) {
                        this.events.log('error', `Failed to set ${switchState} on device ${JSON.stringify(affectedDevice)} to false with error ${error}`);
                    }
                });
                break;
            case 32:
                this.events.emitSetState(switchState, false, false, (error) => {
                    if (error) {
                        this.events.log('error', `Failed to set ${switchState} on device ${JSON.stringify(affectedDevice)} to false with error ${error}`);
                    }
                });
                break;
            case 34:
                this.events.emitSetState(switchState, false, false, (error) => {
                    if (error) {
                        this.events.log('error', `Failed to set ${switchState} on device ${JSON.stringify(affectedDevice)} to false with error ${error}`);
                    }
                });
                break;
            case 36:
                this.events.emitSetState(switchState, false, false, (error) => {
                    if (error) {
                        this.events.log('error', `Failed to set ${switchState} on device ${JSON.stringify(affectedDevice)} to false with error ${error}`);
                    }
                });
                break;
            case 38:
                this.events.emitSetState(switchState, false, false, (error) => {
                    if (error) {
                        this.events.log('error', `Failed to set ${switchState} on device ${JSON.stringify(affectedDevice)} to false with error ${error}`);
                    }
                });
                break;
            case 72:
                this.events.emitSetState(switchState, false, false, (error) => {
                    if (error) {
                        this.events.log('error', `Failed to set ${switchState} on device ${JSON.stringify(affectedDevice)} to false with error ${error}`);
                    }
                });
                break;
            case 69:
                this.events.emitSetState(switchState, false, false, (error) => {
                    if (error) {
                        this.events.log('error', `Failed to set ${switchState} on device ${JSON.stringify(affectedDevice)} to false with error ${error}`);
                    }
                });
                break;
        }
    }
    vdsmNotificationSaveScene(msg) {
        this.events.log('debug', `received save scene event ${JSON.stringify(msg)}`);
        if (msg && msg.dSUID) {
            msg.dSUID.forEach((id) => __awaiter(this, void 0, void 0, function* () {
                const affectedDevice = this.devices.find((d) => d.dSUID.toLowerCase() == id.toLowerCase());
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
                            try {
                                if (stateObj) {
                                    const sceneVals = {};
                                    const sensorStates = [];
                                    let key;
                                    let state;
                                    for ([key, state] of Object.entries(stateObj)) {
                                        this.events.log('debug', 'msg value from state: ' + JSON.stringify(state));
                                        const dC = false;
                                        sceneVals[key] = { value: state.val, dontCare: dC };
                                    }
                                    affectedDevice.scenes = affectedDevice.scenes.filter((d) => d.sceneId != msg.scene);
                                    affectedDevice.scenes.push({
                                        sceneId: msg.scene,
                                        values: sceneVals,
                                    });
                                    this.events.log('debug', `Set scene ${msg.scene} on ${affectedDevice.name} ::: ${JSON.stringify(this.devices)}`);
                                    this.events.emitObject('updateDeviceValues', affectedDevice);
                                }
                            }
                            catch (err) {
                                this.events.log('warn', `there was an issue retrieving your state(s) ${JSON.stringify(getStates)} on device ${affectedDevice}: failed with error ${err}`);
                            }
                        };
                        this.events.emitGetState(getStates, handleCallback.bind(this));
                    }
                }
            }));
        }
    }
    vdsmNotificationSetOutputChannelValue() { }
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