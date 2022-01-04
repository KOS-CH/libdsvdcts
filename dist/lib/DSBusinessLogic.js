"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSBusinessLogic = void 0;
class DSBusinessLogic {
    constructor(config) {
        this.events = config.events;
        this.devices = config.devices;
        this.events.on('binaryInputStateRequest', this.binaryInputStateRequest.bind(this));
        this.events.on('sensorStatesRequest', this.sensorStatesRequest.bind(this));
        this.events.on('VDSM_NOTIFICATION_SET_CONTROL_VALUE', this.vdsmNotificationSetControlValue.bind(this));
        this.events.on('VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE', this.vdsmNotificationSetOutputChannelValue.bind(this));
        this.events.on('VDSM_NOTIFICATION_SAVE_SCENE', this.vdsmNotificationSaveScene.bind(this));
        this.events.on('VDSM_NOTIFICATION_CALL_SCENE', this.vdsmNotificationCallScene.bind(this));
        this.events.on('channelStatesRequest', this.channelStatesRequest.bind(this));
    }
    binaryInputStateRequest() {
        console.log('TEEEEEEEESSST\n\n\n\n\n');
    }
    sensorStatesRequest() {
        console.log('SEEEEEEEEEEEEEEEEEEEEENSOR\n\n\n\n');
        this.events.emitGetState('getState', 'blah.0', () => {
            console.log('CAAALLLLBAAACK\n\n\n\n\n\n\n');
        });
    }
    channelStatesRequest() { }
    vdsmNotificationCallScene() { }
    vdsmNotificationSaveScene() { }
    vdsmNotificationSetOutputChannelValue() { }
    vdsmNotificationSetControlValue(msg) {
        console.log('CONTROLVALUE RECEIVED', JSON.stringify(msg));
        if (msg && msg.name) {
            if (msg && msg.dSUID) {
                msg.dSUID.forEach((id) => {
                    const affectedDevice = this.devices.find((d) => d.dSUID.toLowerCase() == id.toLowerCase());
                    if (affectedDevice) {
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
                        console.log('SET STATE for TemperatureOutside');
                        this.events.emitSetState('DS-Devices.outdoorValues.temperature', msg.value, true, (error) => {
                            if (error)
                                console.error(`Failed setting DS-Devices.outdoorValues.temperature to value ${msg.value} with error ${error}`);
                        });
                    }
                    else if (msg.name === 'BrightnessOutside') {
                        this.events.emitSetState('DS-Devices.outdoorValues.brightness', msg.value, true, (error) => {
                            if (error)
                                console.error(`Failed setting DS-Devices.outdoorValues.brightness to value ${msg.value} with error ${error}`);
                        });
                    }
                });
            }
        }
    }
}
exports.DSBusinessLogic = DSBusinessLogic;
//# sourceMappingURL=DSBusinessLogic.js.map