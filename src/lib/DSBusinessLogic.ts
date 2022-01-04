import {libdsvdc} from './libdsvdc';

export class DSBusinessLogic {
  events: libdsvdc;
  devices: any;
  constructor(config: {events: libdsvdc; devices: any}) {
    this.events = config.events;
    this.devices = config.devices;
    this.events.on(
      'binaryInputStateRequest',
      this.binaryInputStateRequest.bind(this)
    );
    this.events.on('sensorStatesRequest', this.sensorStatesRequest.bind(this));
    this.events.on(
      'VDSM_NOTIFICATION_SET_CONTROL_VALUE',
      this.vdsmNotificationSetControlValue.bind(this)
    );
    this.events.on(
      'VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE',
      this.vdsmNotificationSetOutputChannelValue.bind(this)
    );
    this.events.on(
      'VDSM_NOTIFICATION_SAVE_SCENE',
      this.vdsmNotificationSaveScene.bind(this)
    );
    this.events.on(
      'VDSM_NOTIFICATION_CALL_SCENE',
      this.vdsmNotificationCallScene.bind(this)
    );
    this.events.on(
      'channelStatesRequest',
      this.channelStatesRequest.bind(this)
    );
  }

  private binaryInputStateRequest() {
    console.log('TEEEEEEEESSST\n\n\n\n\n');
  }

  private sensorStatesRequest() {
    console.log('SEEEEEEEEEEEEEEEEEEEEENSOR\n\n\n\n');
    this.events.emitGetState('getState', 'blah.0', () => {
      console.log('CAAALLLLBAAACK\n\n\n\n\n\n\n');
    });
  }

  private channelStatesRequest() {}

  private vdsmNotificationCallScene() {}

  private vdsmNotificationSaveScene() {}

  private vdsmNotificationSetOutputChannelValue() {}

  /**
   * ControlValues are sent by DS on a regular bases including temperature within the zone & outside temperature / brightness. When editing an outputchannel direclty in the hardware tab control values are being used to set the values
   * @param msg
   * @private
   */
  private vdsmNotificationSetControlValue(msg: any) {
    console.log('CONTROLVALUE RECEIVED', JSON.stringify(msg));
    if (msg && msg.name) {
      if (msg && msg.dSUID) {
        msg.dSUID.forEach((id: string) => {
          const affectedDevice = this.devices.find(
            (d: any) => d.dSUID.toLowerCase() == id.toLowerCase()
          );
          if (affectedDevice) {
            // found the device -> it's an update for the device
            // search for the channelID within the watch sates
            const updateStateId = Object.keys(
              affectedDevice.watchStateIDs
            ).find(key => affectedDevice.watchStateIDs[key] === msg.channelId);
            if (updateStateId) {
              // found a state to update in a device
              this.events.emitSetState(
                affectedDevice.watchStateIDs[updateStateId],
                msg.value,
                false,
                (error: any) => {
                  if (error) {
                    console.error(
                      `Failed to set ${
                        affectedDevice.watchStateIDs[updateStateId]
                      } on device ${JSON.stringify(affectedDevice)} to value ${
                        msg.value
                      } with error ${error}`
                    );
                  }
                }
              );
            }
          } else if (msg.name === 'TemperatureOutside') {
            console.log('SET STATE for TemperatureOutside');
            this.events.emitSetState(
              'DS-Devices.outdoorValues.temperature',
              msg.value,
              true,
              (error: any) => {
                if (error)
                  console.error(
                    `Failed setting DS-Devices.outdoorValues.temperature to value ${msg.value} with error ${error}`
                  );
              }
            );
          } else if (msg.name === 'BrightnessOutside') {
            this.events.emitSetState(
              'DS-Devices.outdoorValues.brightness',
              msg.value,
              true,
              (error: any) => {
                if (error)
                  console.error(
                    `Failed setting DS-Devices.outdoorValues.brightness to value ${msg.value} with error ${error}`
                  );
              }
            );
          }
        });
      }
    }
  }
}
