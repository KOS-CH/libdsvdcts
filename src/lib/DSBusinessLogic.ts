import {libdsvdc} from './libdsvdc';
import {Type} from 'protobufjs';

export class DSBusinessLogic {
  events: libdsvdc;
  devices: any;
  vdsm: Type;

  constructor(config: {events: libdsvdc; devices: any; vdsm: Type}) {
    this.events = config.events;
    this.devices = config.devices;
    this.vdsm = config.vdsm;
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
  }

  /**
   * channelState request are used by Digitalstrom to query for the current state. It requires an answer to be sent over the VDC
   * @param msg
   * @private
   */
  private channelStatesRequest(msg: any) {
    console.log(`received request for status ${JSON.stringify(msg)}`);

    // search if the dsUID is known
    if (msg && msg.dSUID) {
      const affectedDevice = this.devices.find(
        (d: any) => d.dSUID.toLowerCase() == msg.dSUID.toLowerCase()
      );
      console.log('FOUND DEVICE: ' + JSON.stringify(affectedDevice));

      if (affectedDevice) {
        // found a device -> lets see what states are required
        const getStates: Array<{[key: string]: string}> = [];
        if (msg && msg.names && msg.names.length > 0) {
          msg.names.forEach((e: any) => {
            // loop all names which are the values of interest
            const updateStateId = Object.keys(
              affectedDevice.watchStateIDs
            ).find(key => affectedDevice.watchStateIDs[key] === e);
            if (updateStateId) {
              // found a state
              let stateObj: {[key: string]: string} = {};
              stateObj[e] = affectedDevice.watchStateIDs[e];
              getStates.push(stateObj);
            }
          });
        } else {
          // names is empty -> sending state for device
          let key;
          let value;
          for ([key, value] of Object.entries(affectedDevice.watchStateIDs)) {
            // loop all states
            let stateObj: {[key: string]: string} = {};
            stateObj[key as string] = value as string;
            getStates.push(stateObj);
          }
        }
        if (getStates && getStates.length > 0) {
          // we have some states to process
          const handleCallback = (stateObj: any) => {
            if (stateObj) {
              // we have a reply
              console.log(JSON.stringify(stateObj));
              const elements: Array<any> = [];
              let key;
              let value: any;
              for ([key, value] of Object.entries(stateObj)) {
                // loop all states
                let valueObj: {[key: string]: any} = {};
                console.log(
                  '---------------\n\n\n\nTYPEOF VALUE: ',
                  typeof value.val,
                  '-----------------\n\n\n'
                );
                if (typeof value.val == 'boolean') {
                  valueObj.vBool = value.val;
                } else if (typeof value.val == 'number') {
                  valueObj.vDouble = value.val;
                }

                elements.push({
                  name: key as string,
                  elements: [
                    {name: 'age', value: {vDouble: 1}},
                    {name: 'error', value: {vUint64: '0'}},
                    {name: 'value', value: valueObj},
                  ],
                });
              }
              // send it to the VDC
              this.sendComplexState(msg.messageId, elements);
            }
          };
          this.events.emitGetState(getStates, handleCallback.bind(this));
        }
      }
    }
  }

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
          if (
            affectedDevice &&
            msg.name !== 'TemperatureOutside' &&
            msg.name !== 'BrightnessOutside'
          ) {
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

  private sendComplexState(messageId: number, rawSubElements: any) {
    const properties = [];
    /* const subElements = createSubElements({
          name: rawSubElements.name,
          elements: rawSubElements.elements,
        }); */
    if (rawSubElements instanceof Array) {
      properties.push({
        name: 'channelStates',
        elements: rawSubElements,
      });
    } else {
      properties.push({
        name: 'channelStates',
        elements: [rawSubElements],
      });
    }

    console.log(
      JSON.stringify({
        type: 5,
        messageId: messageId,
        vdcResponseGetProperty: {properties},
      })
    );
    const answerObj = this.vdsm.fromObject({
      type: 5,
      messageId: messageId,
      vdcResponseGetProperty: {properties},
    });
    const answerBuf = this.vdsm.encode(answerObj).finish();
    console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    // conn.write(this._addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property {object} Message Object
     */
    this.events.emitObject('vdcPushChannelStates', answerBuf);
    this.events.emitObject('messageSent', this.vdsm.decode(answerBuf));
  }
}
