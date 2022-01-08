import {libdsvdc} from './libdsvdc';
import {Type} from 'protobufjs';
import {createSubElements} from './messageMapping';
import {rgbhelper} from 'rgbhelper';

export class DSBusinessLogic {
  events: libdsvdc;
  devices: any;
  vdsm: Type;
  outputChannelBuffer: Array<{
    dSUID: string;
    buffer: Array<{
      name: string;
      state: string;
      value: string | number | undefined;
    }>;
  }>;

  constructor(config: {events: libdsvdc; devices: any; vdsm: Type}) {
    this.events = config.events;
    this.devices = config.devices;
    this.vdsm = config.vdsm;
    this.outputChannelBuffer = [];
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

  private binaryInputStateRequest(msg: any) {
    this.events.log(
      'debug',
      `received request for binaryInputStateRequest ${JSON.stringify(msg)}`
    );

    // search if the dsUID is known
    if (msg && msg.dSUID) {
      const affectedDevice = this.devices.find(
        (d: any) => d.dSUID.toLowerCase() == msg.dSUID.toLowerCase()
      );
      this.events.log(
        'debug',
        `found device ${JSON.stringify(affectedDevice)}`
      );
      if (affectedDevice && affectedDevice.binaryInputDescriptions) {
        const inputStates: Array<any> = [];
        affectedDevice.binaryInputDescriptions.forEach((i: any) => {
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

  private sensorStatesRequest(msg: any) {
    if (msg && msg.dSUID) {
      const affectedDevice = this.devices.find(
        (d: any) => d.dSUID.toLowerCase() == msg.dSUID.toLowerCase()
      );

      if (affectedDevice && affectedDevice.sensorDescription) {
        // found device, lets do some magic
        const getStates: Array<{[key: string]: string}> = [];
        let key;
        let value;
        for ([key, value] of Object.entries(affectedDevice.watchStateIDs)) {
          // loop all states
          let stateObj: {[key: string]: string} = {};
          stateObj[key as string] = value as string;
          getStates.push(stateObj);
        }

        if (getStates && getStates.length > 0) {
          // we have some states to process
          const handleCallback = (stateObj: any) => {
            if (stateObj) {
              const sensorStates: Array<any> = [];
              let key: string;
              let state: any;
              for ([key, state] of Object.entries(stateObj)) {
                this.events.log(
                  'debug',
                  'msg value from state: ' + JSON.stringify(state)
                );

                if (
                  affectedDevice.modifiers &&
                  typeof affectedDevice.modifiers == 'object' &&
                  key &&
                  affectedDevice.modifiers[key as string]
                ) {
                  state.val =
                    (state.val as number) *
                    parseFloat(affectedDevice.modifiers[key as string]);
                }

                sensorStates.push({
                  name: key as string,
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

  /**
   * channelState request are used by Digitalstrom to query for the current state. It requires an answer to be sent over the VDC
   * @param msg
   * @private
   */
  private channelStatesRequest(msg: any) {
    this.events.log(
      'debug',
      `received request for channelState ${JSON.stringify(msg)}`
    );

    // search if the dsUID is known
    if (msg && msg.dSUID) {
      const affectedDevice = this.devices.find(
        (d: any) => d.dSUID.toLowerCase() == msg.dSUID.toLowerCase()
      );
      this.events.log(
        'debug',
        'FOUND DEVICE: ' + JSON.stringify(affectedDevice)
      );

      if (affectedDevice && affectedDevice.channelDescriptions) {
        // found a device -> lets see what states are required
        const getStates: Array<{[key: string]: string}> = [];
        if (msg && msg.names && msg.names.length > 0) {
          this.events.log(
            'debug',
            `get channelStates with names: ${JSON.stringify(msg.names)}`
          );
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
          this.events.log(
            'debug',
            `names was empty in the channelstate request: affectedDevice ${JSON.stringify(
              affectedDevice
            )}`
          );
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
              this.events.log(
                'debug',
                `channelStates stateObj: ${JSON.stringify(stateObj)}`
              );
              let elements: Array<any> = [];
              let key;
              let value: any;
              for ([key, value] of Object.entries(stateObj)) {
                // loop all states
                let valueObj: {[key: string]: any} = {};
                this.events.log(
                  'debug',
                  `channelState value detection: ${typeof value.val}`
                );
                if (msg && msg.names && msg.names.length > 0) {
                  this.events.log(
                    'debug',
                    'names in channelState request was full -> normal processing'
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
                } else {
                  // names was an empty array -> we cannot return named elements
                  this.events.log(
                    'debug',
                    'names in channelState request was empty -> breakout for flat elements array'
                  );
                  if (value.val) {
                    // switch is set to true -> the value is 100
                    value.val = 100;
                  } else {
                    // switch is set to false -> the value is 0
                    value.val = 0;
                  }

                  const subElements = createSubElements({
                    0: {age: 1, value: value.val},
                  });
                  /*elements.push({name: 'age', value: {vDouble: 1}});
                  elements.push({name: 'error', value: {vUint64: '0'}});
                  elements.push({name: 'value', value: valueObj});*/
                  elements = subElements;

                  this.events.log(
                    'debug',
                    `empty names channelstate: ${JSON.stringify(elements)}`
                  );
                }
              }
              // send it to the VDC
              this._sendComplexState(msg.messageId, elements);
            }
          };
          this.events.emitGetState(getStates, handleCallback.bind(this));
        }
      }
    }
  }

  private vdsmNotificationCallScene(msg: any) {
    this.events.log(
      'debug',
      `received call scene event ${JSON.stringify(msg)}`
    );
    if (msg && msg.dSUID) {
      msg.dSUID.forEach((id: string) => {
        const affectedDevice = this.devices.find(
          (d: any) => d.dSUID.toLowerCase() == id.toLowerCase()
        );
        if (affectedDevice && affectedDevice.scenes) {
          // check if there is a stored scene first, if yes, execute the stored values. if not, fallback to the default which takes care of shutting down based on predefined scenes
          const storedScene = affectedDevice.scenes.find((s: any) => {
            return s.sceneId == msg.scene;
          });
          if (storedScene) {
            // we found a stored scene -> execute it
            let key: any;
            let value: any;
            this.events.log(
              'debug',
              `looping the values inside scene ${msg.scene} -> ${JSON.stringify(
                storedScene
              )}`
            );
            for ([key, value] of Object.entries(storedScene.values)) {
              this.events.log(
                'debug',
                `performing update on state: ${key} ${JSON.stringify(
                  affectedDevice.watchStateIDs
                )} with key ${key} value ${value.value}`
              );
              // if (key == "switch") value.value = true; // set power state on
              this.events.log(
                'debug',
                `setting ${value.value} of ${affectedDevice.name} to on ${affectedDevice.watchStateIDs[key]}`
              );
              this.events.emitSetState(
                affectedDevice.watchStateIDs[key],
                value.value,
                false,
                (error: any) => {
                  if (error) {
                    this.events.log(
                      'error',
                      `Failed to set ${
                        affectedDevice.watchStateIDs[key]
                      } on device ${JSON.stringify(affectedDevice)} to value ${
                        value.value
                      } with error ${error}`
                    );
                  }
                }
              );
            }
          } else {
            // no stored scene found -> executing poweroff if the scene matches some predefined values
            // first search for the poweroff state
            const switchState = affectedDevice.watchStateIDs['switch'];
            this.events.log(
              'debug',
              `no stored scene found -> executing some default sets - scene: ${msg.scene} switchState: ${switchState}`
            );
            if (switchState) {
              // perform default scene set
              this._performDefaultScenesSet(msg, switchState, affectedDevice);
            } else {
              this.events.log(
                'debug',
                `no switch state found in ${JSON.stringify(
                  affectedDevice
                )} for scene ${msg.scene}`
              );
            }
          }
        } else if (affectedDevice) {
          // no scenes configured. Perform the default set
          const switchState = affectedDevice.watchStateIDs['switch'];
          if (switchState)
            this._performDefaultScenesSet(msg, switchState, affectedDevice);
        }
      });
    }
  }

  /**
   * Digitalstrom has some default scenes (actually many of them). This function takes care of some of them (the most important ones)
   * @param msg
   * @param switchState
   * @param affectedDevice
   * @private
   */
  private _performDefaultScenesSet(
    msg: any,
    switchState: string,
    affectedDevice: any
  ) {
    switch (msg.scene) {
      case 0:
        // Set output value to Preset 0 (Default: Off)
        this.events.emitSetState(switchState, false, false, (error: any) => {
          if (error) {
            this.events.log(
              'error',
              `Failed to set ${switchState} on device ${JSON.stringify(
                affectedDevice
              )} to false with error ${error}`
            );
          }
        });
        break;
      case 13:
        // Special Scene Minimum
        this.events.log(
          'debug',
          `no stored scene found -> executing some default sets - scene: ${msg.scene} switchState: ${switchState} - matching minium scene 13`
        );
        this.events.emitSetState(switchState, false, false, (error: any) => {
          if (error) {
            this.events.log(
              'error',
              `Failed to set ${switchState} on device ${JSON.stringify(
                affectedDevice
              )} to false with error ${error}`
            );
          }
        });
        break;
      case 14:
        // Special Scene Maximum
        this.events.log(
          'debug',
          `no stored scene found -> executing some default sets - scene: ${msg.scene} switchState: ${switchState} - matching maximum scene 14`
        );
        this.events.emitSetState(switchState, true, false, (error: any) => {
          if (error) {
            this.events.log(
              'error',
              `Failed to set ${switchState} on device ${JSON.stringify(
                affectedDevice
              )} to false with error ${error}`
            );
          }
        });
        break;
      case 32:
        // Set output value to Preset 10 (Default: Off)
        this.events.emitSetState(switchState, false, false, (error: any) => {
          if (error) {
            this.events.log(
              'error',
              `Failed to set ${switchState} on device ${JSON.stringify(
                affectedDevice
              )} to false with error ${error}`
            );
          }
        });
        break;
      case 34:
        // Set output value to Preset 20 (Default: Off)
        this.events.emitSetState(switchState, false, false, (error: any) => {
          if (error) {
            this.events.log(
              'error',
              `Failed to set ${switchState} on device ${JSON.stringify(
                affectedDevice
              )} to false with error ${error}`
            );
          }
        });
        break;
      case 36:
        // Set output value to Preset 30 (Default: Off)
        this.events.emitSetState(switchState, false, false, (error: any) => {
          if (error) {
            this.events.log(
              'error',
              `Failed to set ${switchState} on device ${JSON.stringify(
                affectedDevice
              )} to false with error ${error}`
            );
          }
        });
        break;
      case 38:
        // Set output value to Preset 40 (Default: Off)
        this.events.emitSetState(switchState, false, false, (error: any) => {
          if (error) {
            this.events.log(
              'error',
              `Failed to set ${switchState} on device ${JSON.stringify(
                affectedDevice
              )} to false with error ${error}`
            );
          }
        });
        break;
      case 72:
        // Absent (Default: Off)
        this.events.emitSetState(switchState, false, false, (error: any) => {
          if (error) {
            this.events.log(
              'error',
              `Failed to set ${switchState} on device ${JSON.stringify(
                affectedDevice
              )} to false with error ${error}`
            );
          }
        });
        break;
      case 69:
        // Sleeping (Default: Off)
        this.events.emitSetState(switchState, false, false, (error: any) => {
          if (error) {
            this.events.log(
              'error',
              `Failed to set ${switchState} on device ${JSON.stringify(
                affectedDevice
              )} to false with error ${error}`
            );
          }
        });
        break;
    }
  }

  private vdsmNotificationSaveScene(msg: any) {
    this.events.log(
      'debug',
      `received save scene event ${JSON.stringify(msg)}`
    );
    if (msg && msg.dSUID) {
      msg.dSUID.forEach(async (id: string) => {
        // this.log.debug(`searching for ${id} in ${JSON.stringify(this.config.dsDevices)}`);
        const affectedDevice = this.devices.find(
          (d: any) => d.dSUID.toLowerCase() == id.toLowerCase()
        );
        if (affectedDevice) {
          const getStates: Array<{[key: string]: string}> = [];
          let key;
          let value;
          for ([key, value] of Object.entries(affectedDevice.watchStateIDs)) {
            // loop all states
            let stateObj: {[key: string]: string} = {};
            stateObj[key as string] = value as string;
            getStates.push(stateObj);
          }

          if (getStates && getStates.length > 0) {
            const handleCallback = (stateObj: any) => {
              if (stateObj) {
                // we have some return values -> store them into the scene object
                const sceneVals: any = {};
                const sensorStates: Array<any> = [];
                let key: string;
                let state: any;
                for ([key, state] of Object.entries(stateObj)) {
                  this.events.log(
                    'debug',
                    'msg value from state: ' + JSON.stringify(state)
                  );
                  const dC = false;
                  sceneVals[key] = {value: state.val, dontCare: dC}; // TODO understand and make it dynamic
                }
                // delete the current scene first
                affectedDevice.scenes = affectedDevice.scenes.filter(
                  (d: any) => d.sceneId != msg.scene
                );
                affectedDevice.scenes.push({
                  sceneId: msg.scene,
                  values: sceneVals,
                });
                this.events.log(
                  'debug',
                  `Set scene ${msg.scene} on ${
                    affectedDevice.name
                  } ::: ${JSON.stringify(this.devices)}`
                );
                // make it persistent by storing it back to the device
                this.events.emitObject('updateDeviceValues', affectedDevice);
              }
            };
            this.events.emitGetState(getStates, handleCallback.bind(this));
          }
        }
      });
    }
  }

  private vdsmNotificationSetOutputChannelValue(msg: any) {
    this.events.log(
      'debug',
      `received OUTPUTCHANNELVALUE value ${JSON.stringify(msg)}`
    );
    if (msg && msg.dSUID) {
      msg.dSUID.forEach((id: string) => {
        const affectedDevice = this.devices.find(
          (d: any) => d.dSUID.toLowerCase() == id.toLowerCase()
        );
        if (affectedDevice) {
          const affectedState = affectedDevice.watchStateIDs[msg.channelId];
          if (affectedState) {
            let myOutputChannelBuffer = this.outputChannelBuffer.find(
              b => b.dSUID == msg.dSUID
            );
            if (!myOutputChannelBuffer) {
              // first value -> create a new buffer object
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
              // write buffer and clear it again
              if (
                Object.keys(affectedDevice.watchStateIDs).includes('rgb') &&
                myOutputChannelBuffer.buffer.find(
                  b => b.name == 'saturation'
                ) &&
                myOutputChannelBuffer.buffer.find(b => b.name == 'hue') &&
                myOutputChannelBuffer.buffer.find(b => b.name == 'brightness')
              ) {
                // we have a colorupdate. since we have an rgb value, we don't care about sat, hue & brightness anymore
                this.events.log(
                  'debug',
                  'colorupdate and we have found an rgb watchState'
                );
                const sat = myOutputChannelBuffer.buffer.find(
                  b => b.name == 'saturation'
                );
                const hue = myOutputChannelBuffer.buffer.find(
                  b => b.name == 'hue'
                );
                const brightness = myOutputChannelBuffer.buffer.find(
                  b => b.name == 'brightness'
                );
                if (sat && hue && brightness) {
                  this.events.log(
                    'debug',
                    `Hue: ${hue.value} Saturation: ${sat.value} Brightness: ${brightness.value}`
                  );
                  const rgb = rgbhelper.hsvTOrgb(
                    hue.value,
                    sat.value,
                    brightness.value
                  );
                  const rgbHex = rgbhelper.rgbTOhex(rgb);
                  this.events.log('debug', `Calculated rgb in hex: ${rgbHex}`);
                  const rgbState = affectedDevice.watchStateIDs['rgb'];
                  this.events.emitSetState(
                    rgbState,
                    rgbHex,
                    false,
                    (error: any) => {
                      if (error) {
                        this.events.log(
                          'error',
                          `Failed to set ${rgbState} on device ${JSON.stringify(
                            affectedDevice
                          )} to value ${rgbHex} with error ${error}`
                        );
                      }
                    }
                  );
                  // clear brightness & hue & sat from buffer, since we already took care of using them for rgb
                  myOutputChannelBuffer.buffer =
                    myOutputChannelBuffer.buffer.filter(function (obj) {
                      return (
                        obj.name !== 'brightness' &&
                        obj.name !== 'hue' &&
                        obj.name != 'saturation'
                      );
                    });
                }
              }
              // apply everything within the buffer
              myOutputChannelBuffer.buffer.forEach((b: any) => {
                // set state
                this.events.emitSetState(
                  b.state,
                  b.value,
                  false,
                  (error: any) => {
                    if (error) {
                      this.events.log(
                        'error',
                        `Failed to set ${b.state} on device ${JSON.stringify(
                          affectedDevice
                        )} to value ${b.value} with error ${error}`
                      );
                    }
                  }
                );
              });
              // delete buffer
              this.outputChannelBuffer = this.outputChannelBuffer.filter(
                function (obj) {
                  return obj.dSUID !== msg.dSUID;
                }
              );
            }
          }
        }
      });
    }
  }

  /**
   * ControlValues are sent by DS on a regular bases including temperature within the zone & outside temperature / brightness. When editing an outputchannel direclty in the hardware tab control values are being used to set the values
   * @param msg
   * @private
   */
  private vdsmNotificationSetControlValue(msg: any) {
    this.events.log('debug', 'CONTROLVALUE RECEIVED ' + JSON.stringify(msg));
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
            this.events.log('debug', 'SET STATE for TemperatureOutside');
            this.events.emitSetState(
              'DS-Devices.outdoorValues.temperature',
              msg.value,
              true,
              (error: any) => {
                if (error)
                  this.events.log(
                    'error',
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
                  this.events.log(
                    'error',
                    `Failed setting DS-Devices.outdoorValues.brightness to value ${msg.value} with error ${error}`
                  );
              }
            );
          }
        });
      }
    }
  }

  private _sendComplexState(messageId: number, rawSubElements: any) {
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

    this.events.log(
      'debug',
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
    this.events.log('debug', JSON.stringify(this.vdsm.decode(answerBuf)));
    // conn.write(this._addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property {object} Message Object
     */
    this.events.emitObject('vdcPushChannelStates', answerBuf);
    this.events.emitObject('messageSent', this.vdsm.decode(answerBuf));
  }

  private _sendSensorStatesRequest(sensorStates: any, messageId: number) {
    const properties = [];
    const elements: any = [];
    if (sensorStates && sensorStates.length > 0) {
      sensorStates.forEach((i: any) => {
        const subElements = createSubElements({
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

      this.events.log(
        'debug',
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
      this.events.log('debug', JSON.stringify(this.vdsm.decode(answerBuf)));
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

  private _sendBinaryInputState(inputStates: any, messageId: number) {
    const properties = [];
    const elements: any = [];
    if (inputStates && inputStates.length > 0) {
      inputStates.forEach((i: any) => {
        const subElements = createSubElements({
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

      this.events.log(
        'debug',
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
      this.events.log('debug', JSON.stringify(this.vdsm.decode(answerBuf)));
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
}
