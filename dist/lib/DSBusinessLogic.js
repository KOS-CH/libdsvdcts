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
    binaryInputStateRequest() { }
    sensorStatesRequest() { }
    channelStatesRequest() { }
    vdsmNotificationCallScene() { }
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
    vdsmNotificationSaveScene() { }
    vdsmNotificationSetOutputChannelValue() { }
    vdsmNotificationSetControlValue() { }
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