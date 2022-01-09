import {libdsvdc} from './libdsvdc';

import {
  sensorDescriptions,
  outputDescription,
  outputSettings,
  createSubElements,
  globalHelperItem,
} from './messageMapping';

/**
 * Parses the vdsmGetProperty message to add values wherever it's known
 * @param  {} conn
 * @param  {Object} decodedMessage
 */
export function _vdcResponseGetProperty(
  this: libdsvdc,
  conn: any,
  decodedMessage: any
) {
  const properties: any = [];
  let sendIt = true;
  if (
    decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase() ===
    this.config.vdcDSUID.toLowerCase()
  ) {
    // this is our VDC -> no lookup for devices
    decodedMessage.vdsmRequestGetProperty.query.forEach((p: any) => {
      if (this.debug) console.log('Query', p);
      if (p.name == 'name') {
        properties.push({
          name: 'name',
          value: {vString: this.config.vdcName},
        });
      } else if (p.name == 'capabilities') {
        properties.push({
          name: 'capabilities',
          elements: [
            {
              name: 'dynamicDefinitions',
              value: {vBool: false},
            },
            {
              name: 'identification',
              value: {vBool: true},
            },
            {
              name: 'metering',
              value: {vBool: false},
            },
          ],
        });
        // start timer to announce devices ...
        setTimeout(() => {
          this.emit('vdcAnnounceDevices');
        }, 10 * 1000);
      } else if (p.name == 'modelVersion') {
        properties.push({
          name: 'modelVersion',
          value: {vString: this.VERSION},
        });
      } else if (p.name == 'configURL' && this.config.configURL) {
        properties.push({
          name: 'configURL',
          value: {vString: this.config.configURL},
        });
      } else if (p.name == 'hardwareVersion') {
        properties.push({
          name: 'hardwareVersion',
          value: {vString: this.VERSION},
        });
      } else if (p.name == 'model') {
        properties.push({
          name: 'model',
          value: {vString: this.MODEL},
        });
      } else if (p.name == 'displayId') {
        properties.push({
          name: 'displayId',
          value: {vString: this.config.vdcName},
        });
      } else if (p.name == 'vendorName') {
        properties.push({
          name: 'vendorName',
          value: {vString: this.VENDORNAME},
        });
      }
    });
  } else {
    // lookup device array for properties
    const device = this.devices.find(
      (d: any) =>
        d.dSUID.toLowerCase() ==
        decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase()
    );
    if (
      device &&
      decodedMessage.vdsmRequestGetProperty &&
      decodedMessage.vdsmRequestGetProperty.query &&
      Array.isArray(decodedMessage.vdsmRequestGetProperty.query)
    ) {
      decodedMessage.vdsmRequestGetProperty.query.forEach((p: any) => {
        if (this.debug) console.log('Query', p);
        if (p.name == 'scenes') {
          const biElements: any = [];
          p.elements.forEach((s: any) => {
            // loop all scenes and add the dontCare value
            // TODO maybe add more values
            if (device && device.scenes) {
              const scene = device.scenes.find((ss: any) => {
                return ss.sceneId == s.name;
              });
              if (scene) {
                // scene found -> add it to the response
                const cdObj = {
                  dontCare: scene.dontCare,
                  ignoreLocalPriority: scene.ignoreLocalPriority,
                  effect: scene.effect,
                };
                const subElements = createSubElements(cdObj);

                biElements.push({
                  name: s.name,
                  elements: subElements,
                });
              }
            }
          });
          properties.push({
            name: p.name,
            elements: biElements,
          });
        }
        if (p.name == 'outputSettings') {
          // outputSettings
          let elements: any = [];
          const biElements: any = [];
          if (device.outputSettings) {
            device.outputSettings.forEach(
              (desc: {[key: string]: string; value: any}) => {
                // loop all keys of an object
                elements = [];

                for (const [key, value] of Object.entries(desc)) {
                  if (
                    key &&
                    outputSettings.find((o: globalHelperItem) => o.name == key)
                  ) {
                    if (
                      outputSettings &&
                      outputSettings.find(
                        (o: globalHelperItem) => o.name == key
                      )?.type == 'elements'
                    ) {
                      const subElements: any = [];
                      value.forEach((s: any) => {
                        subElements.push({
                          name: s,
                          value: {
                            vBool: 'true',
                          },
                        });
                      });
                      elements.push({
                        name: key,
                        elements: subElements,
                      });
                    } else {
                      const valObj: any = {};
                      const keyObj = outputSettings.find(
                        (o: globalHelperItem) => o.name == key
                      );
                      const objKey: string = keyObj?.type as string;
                      valObj[objKey] = value;
                      elements.push({
                        name: key,
                        value: valObj,
                      });
                    }
                    if (this.debug) {
                      console.log('ADDED ELEMENTS', JSON.stringify(elements));
                    }
                  }
                }
                biElements.push({
                  name: desc.objName,
                  elements: elements,
                });
              }
            );
          }
          if (biElements.length > 0) {
            properties.push({
              name: 'outputSettings',
              elements: biElements,
            });
          } else {
            // commented, because p44 does not send it
            /* properties.push({
                          name: p.name,
                          elements: [{ name: "" }],
                        }); */
          }
          if (this.debug) console.log(JSON.stringify(properties));
        } else if (p.name == 'outputDescription') {
          // outputDescription
          let elements: any = [];
          const biElements: any = [];
          if (device.outputDescription) {
            device.outputDescription.forEach(
              (desc: {[key: string]: string; value: any}) => {
                // loop all keys of an object
                elements = [];

                for (const [key, value] of Object.entries(desc)) {
                  if (key && outputDescription.find(o => o.name == key)) {
                    const valObj: any = {};
                    const keyObj = outputDescription.find(
                      (o: globalHelperItem) => o.name == key
                    );
                    const objKey: string = keyObj?.type as string;
                    valObj[objKey] = value;
                    elements.push({
                      name: key,
                      value: valObj,
                    });
                    if (this.debug) {
                      console.log('ADDED ELEMENTS', JSON.stringify(elements));
                    }
                  }
                }
                biElements.push({
                  name: desc.objName,
                  elements: elements,
                });
              }
            );
          }
          if (biElements.length > 0) {
            properties.push({
              name: 'outputDescription',
              elements: biElements,
            });
          } else {
            // commented, because p44 does not send it
            /* properties.push({
                          name: p.name,
                          elements: [{ name: "" }],
                        }); */
          }
        } else if (p.name == 'buttonInputSettings') {
          // buttonInputSettings
          if (Array.isArray(device.buttonInputSettings)) {
            const biElements: any = [];
            device.buttonInputSettings.forEach((cdObj: any, i: number) => {
              if (
                cdObj &&
                typeof cdObj === 'object' &&
                !Array.isArray(cdObj) &&
                cdObj !== null
              ) {
                const subElements = createSubElements(cdObj);

                biElements.push({
                  // name: `generic_${i}`,
                  name: cdObj.objName,
                  elements: subElements,
                });
              } else {
                properties.push({
                  // name: `generic_${i}`,
                  name: cdObj.objName,
                });
              }
            });
            properties.push({
              name: p.name,
              elements: biElements,
            });
          } else {
            properties.push({
              name: p.name,
            });
          }
        } else if (p.name == 'buttonInputDescriptions') {
          // buttonInputSettings
          if (Array.isArray(device.buttonInputDescriptions)) {
            const biElements: any = [];
            device.buttonInputDescriptions.forEach((cdObj: any, i: number) => {
              if (
                cdObj &&
                typeof cdObj === 'object' &&
                !Array.isArray(cdObj) &&
                cdObj !== null
              ) {
                const subElements = createSubElements(cdObj);

                biElements.push({
                  // name: `generic_${i}`,
                  name: cdObj.objName,
                  elements: subElements,
                });
              } else {
                properties.push({
                  // name: `generic_${i}`,
                  name: cdObj.objName,
                });
              }
            });
            properties.push({
              name: p.name,
              elements: biElements,
            });
          } else {
            // commented, because p44 does not send it
            /* properties.push({
                          name: p.name,
                          elements: [{ name: "" }],
                        }); */
          }
        } else if (p.name == 'sensorDescriptions') {
          // sensorDescriptions
          let elements = [];
          const sensorElements: any = [];
          if (device.sensorDescriptions) {
            // console.log("SENSOR DESCRIPTIONS", device.sensorDescription);
            device.sensorDescriptions.forEach(
              (desc: {[key: string]: string; value: any}) => {
                console.log('PROCESSING OBJECT', JSON.stringify(desc));
                // loop all keys of an object
                elements = [];

                for (const [key, value] of Object.entries(desc)) {
                  if (key && sensorDescriptions.find(o => o.name == key)) {
                    const valObj: any = {};
                    const keyObj = sensorDescriptions.find(
                      (o: globalHelperItem) => o.name == key
                    );
                    const objKey: string = keyObj?.type as string;
                    valObj[objKey] = value;
                    elements.push({
                      name: key,
                      value: valObj,
                    });
                    if (this.debug) {
                      console.log(
                        'ADDED ELEMENTS SENSOR',
                        JSON.stringify(elements)
                      );
                    }
                  }
                }
                sensorElements.push({
                  name: desc.objName,
                  elements: elements,
                });
              }
            );
          }
          /* console.log(
                      "\n\n\n\nELEMENTS OF SENSORDESCRIPTIONS\n\n\n",
                      JSON.stringify(elements),
                      elements.length
                    ); */
          if (elements.length > 0) {
            properties.push({
              name: 'sensorDescriptions',
              elements: sensorElements,
            });
          } else {
            properties.push({
              name: 'sensorDescriptions',
            });
          }
        } else if (p.name == 'zoneID') {
          properties.push({
            name: p.name,
            value: {
              vUint64: device.zoneID || 65534,
            },
          });
        } else if (p.name == 'binaryInputDescriptions') {
          // binaryInputDescriptions
          if (Array.isArray(device.binaryInputDescriptions)) {
            const biElements: any = [];
            device.binaryInputDescriptions.forEach((cdObj: any, i: number) => {
              if (
                cdObj &&
                typeof cdObj === 'object' &&
                !Array.isArray(cdObj) &&
                cdObj !== null
              ) {
                const subElements = createSubElements(cdObj);

                biElements.push({
                  // name: `generic_${i}`,
                  // name: `generic`,
                  name: cdObj.objName,
                  elements: subElements,
                });
              } else {
                properties.push({
                  // name: `generic_${i}`,
                  name: cdObj.objName,
                });
              }
            });
            properties.push({
              name: p.name,
              elements: biElements,
            });
          } else {
            properties.push({
              name: p.name,
              elements: [{name: ''}],
            });
          }
        } else if (p.name == 'binaryInputSettings') {
          // binaryInputDescriptions
          if (Array.isArray(device.binaryInputSettings)) {
            const biElements: any = [];
            device.binaryInputSettings.forEach((cdObj: any, i: number) => {
              if (
                cdObj &&
                typeof cdObj === 'object' &&
                !Array.isArray(cdObj) &&
                cdObj !== null
              ) {
                const subElements = createSubElements(cdObj);

                biElements.push({
                  // name: `generic_${i}`,
                  // name: `generic`,
                  name: cdObj.objName,
                  elements: subElements,
                });
              } else {
                properties.push({
                  // name: `generic_${i}`,
                  name: 'generic',
                });
              }
            });
            properties.push({
              name: p.name,
              elements: biElements,
            });
          } else {
            properties.push({
              name: p.name,
            });
          }
        } else if (p.name == 'sensorSettings') {
          // binaryInputDescriptions
          if (Array.isArray(device.sensorSettings)) {
            const biElements: any = [];
            device.sensorSettings.forEach((cdObj: any, i: number) => {
              if (
                cdObj &&
                typeof cdObj === 'object' &&
                !Array.isArray(cdObj) &&
                cdObj !== null
              ) {
                const subElements = createSubElements(cdObj);

                biElements.push({
                  // name: `generic_${i}`,
                  // name: `generic`,
                  name: cdObj.objName,
                  elements: subElements,
                });
              } else {
                properties.push({
                  // name: `generic_${i}`,
                  name: `generic`,
                });
              }
            });
            properties.push({
              name: p.name,
              elements: biElements,
            });
          } else {
            properties.push({
              name: p.name,
            });
          }
        } else if (p.name == 'deviceActionDescriptions') {
          // deviceActionDescriptions
          properties.push({
            name: p.name,
          });
        } else if (p.name == 'customActions') {
          // customActions
          properties.push({
            name: p.name,
          });
        } else if (p.name == 'dynamicActionDescriptions') {
          // dynamicActionDescriptions
          properties.push({
            name: p.name,
          });
        } else if (p.name == 'deviceStates') {
          // deviceStates
          properties.push({
            name: p.name,
          });
        } else if (p.name == 'deviceProperties') {
          // deviceStates
          properties.push({
            name: p.name,
          });
        } else if (p.name == 'channelDescriptions') {
          // channelDescriptions
          if (Array.isArray(device.channelDescriptions)) {
            device.channelDescriptions.forEach((cdObj: any) => {
              if (
                cdObj &&
                typeof cdObj === 'object' &&
                !Array.isArray(cdObj) &&
                cdObj !== null
              ) {
                const subElements = createSubElements(cdObj);

                properties.push({
                  name: p.name,
                  elements: subElements,
                });
              } else {
                properties.push({
                  name: p.name,
                });
              }
            });
          } else {
            properties.push({
              name: p.name,
            });
          }
        } else if (p.name == 'deviceIcon16') {
          // deviceIcon16
          properties.push({
            name: 'deviceIcon16',
            value: {
              vBytes:
                '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',
              // "iVBORw0KGgoAAAANSUhEUgAAABEAAAAQCAYAAADwMZRfAAAAkUlEQVR4AWP4f9u9H4j/k40feguCDfHcJvufcTkP0fjIeUtMQ+ACt5AxTAwvxjRk0czC/w0NDXD86FjI/wv+zDjxl13meFxC2DW4vWPvvuo/o/hJDLx2TiE2V2I3BOEiojBeQxC2YmJ016AaQh7GHjuEbMZqyCBNsZiYhNiBhwVmGIDTDoPYKXQMTjtAvYMsdgCFses+xPm5ggAAAABJRU5ErkJggg==",
            },
          });
        } else if (p.name == 'binaryInputStates') {
          // binaryInputStates
          const message = {
            dSUID: device.dSUID,
            value: 0,
            messageId: decodedMessage.messageId,
          };
          this.emitObject('binaryInputStateRequest', message);
          sendIt = false;
        } else if (p.name == 'sensorStates') {
          // sensorStates
          const message = {
            dSUID: device.dSUID,
            value: 0,
            messageId: decodedMessage.messageId,
          };
          this.emitObject('sensorStatesRequest', message);
          sendIt = false;
        } else if (p.name == 'primaryGroup') {
          // primaryGroup
          properties.push({
            name: 'primaryGroup',
            value: {vUint64: device.primaryGroup},
          });
        } else if (p.name == 'name') {
          // primaryGroup
          properties.push({
            name: 'name',
            value: {vString: device.name},
          });
        } else if (p.name == 'vendorName') {
          // vendorName
          if (device.vendorName) {
            properties.push({
              name: 'vendorName',
              value: {vString: device.vendorName},
            });
          }
        } else if (p.name == 'vendorId') {
          // vendorId
          if (device.vendorId) {
            properties.push({
              name: 'vendorId',
              value: {vString: device.vendorId},
            });
          }
        } else if (p.name == 'configURL') {
          // configURL
          if (device.configURL) {
            properties.push({
              name: 'configURL',
              value: {vString: device.configURL},
            });
          }
        } else if (p.name == 'modelFeatures') {
          // modelFeatures
          if (
            device.modelFeatures &&
            typeof device.modelFeatures === 'object' &&
            !Array.isArray(device.modelFeatures) &&
            device.modelFeatures !== null
          ) {
            const subElements = createSubElements(device.modelFeatures);
            properties.push({
              name: p.name,
              elements: subElements,
            });
          } else {
            properties.push({
              name: p.name,
            });
          }
        } else if (p.name == 'displayId') {
          properties.push({
            name: 'displayId',
            value: {vString: device.displayId},
          });
        } else if (p.name == 'model') {
          properties.push({
            name: p.name,
            value: {vString: device.model},
          });
        } else if (p.name == 'modelUID') {
          properties.push({
            name: p.name,
            value: {vString: device.modelUID},
          });
        } else if (p.name == 'modelVersion') {
          properties.push({
            name: p.name,
            value: {vString: device.modelVersion},
          });
        } else if (p.name == 'name') {
          properties.push({
            name: p.name,
            value: {vString: device.name},
          });
        } else if (p.name == 'channelStates') {
          // loop all indexes
          const messageNames: any = [];
          p.elements.forEach((el: any) => {
            // if (el.name === '0') el.name == 'brightness';
            if (device.channelDescriptions[0][el.name]) {
              // channel described -> emit query to get state
              messageNames.push(el.name);
            }
          });
          const message = {
            dSUID: device.dSUID,
            value: 0,
            names: messageNames,
            messageId: decodedMessage.messageId,
          };
          this.emitObject('channelStatesRequest', message);
          sendIt = false;
        }
      });
    } else {
      // device not found
      if (this.debug) {
        console.error(
          `Device ${decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase()} not found in devicelist`
        );
        if (this.debug)
          console.log(
            `Device ${decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase()} not found in devicelist`
          );
        // send not found to DS
        sendIt = false;
        const errorObj = {
          code: 'ERR_NOT_FOUND',
          description: 'unknown target (missing/invalid dSUID or itemSpec)',
        };
        console.log(errorObj);
        this._genericResponse(conn, errorObj, decodedMessage.messageId);
      }
    }
  }

  if (sendIt) {
    console.log(
      JSON.stringify({
        type: 5,
        messageId: decodedMessage.messageId,
        vdcResponseGetProperty: {properties},
      })
    );
    const answerObj = this.vdsm.fromObject({
      type: 5,
      messageId: decodedMessage.messageId,
      vdcResponseGetProperty: {properties},
    });
    const answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property Message Object
     */
    this.emitObject('messageSent', this.vdsm.decode(answerBuf));
  }
}

/**
 * Push a new value to the VDSM
 * @param {Object} conn
 * @param {*} obj
 */
export function _vdcSendPushProperty(
  this: libdsvdc,
  conn: any,
  message = {
    obj: undefined,
    dSUID: '',
  }
) {
  this.messageId = this.messageId + 1;
  const answerObj = this.vdsm.fromObject({
    type: 12,
    messageId: this.messageId,
    vdcSendPushProperty: {dSUID: message.dSUID, properties: message.obj},
  });
  const answerBuf = this.vdsm.encode(answerObj).finish();
  if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
  conn.write(_addHeaders(answerBuf));
  /**
   * @event messageSent - New message sent to VDSM
   * @type {object}
   * @property Message Object
   */
  this.emit('messageSent', this.vdsm.decode(answerBuf));
}

/**
 * Push a new channelState
 *
 * @param {*} conn
 * @param {*} message
 */
export function _vdcPushChannelStates(this: libdsvdc, conn: any, message: any) {
  conn.write(_addHeaders(message));
  this.emit('messageSent', this.vdsm.decode(message));
}

/**
 * Sends a vdsmResponseHello message
 * @param  {} conn
 * @param  {} decodedMessage
 */
export function _vdsmResponseHello(
  this: libdsvdc,
  conn: any,
  decodedMessage: any
) {
  const answerObj = this.vdsm.fromObject({
    type: 3,
    messageId: decodedMessage.messageId,
    vdcResponseHello: {dSUID: this.config.vdcDSUID},
  });
  const answerBuf = this.vdsm.encode(answerObj).finish();
  if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
  conn.write(_addHeaders(answerBuf));
  /**
   * @event messageSent - New message sent to VDSM
   * @type {object}
   * @property Message Object
   */
  this.emitObject('messageSent', this.vdsm.decode(answerBuf));
}

/**
 * Sends a vdcSendAnnounceVdc message
 * @param  {} conn
 */
export function _vdcSendAnnounceVdc(this: libdsvdc, conn: any) {
  this.messageId = this.messageId + 1;
  let answerObj = this.vdsm.fromObject({
    type: 23,
    messageId: this.messageId,
    vdcSendAnnounceVdc: {dSUID: this.config.vdcDSUID},
  });
  const answerBuf = this.vdsm.encode(answerObj).finish();
  if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
  conn.write(_addHeaders(answerBuf));
  /**
   * @event messageSent - New message sent to VDSM
   * @type {object}
   * @property Message Object
   */
  this.emitObject('messageSent', this.vdsm.decode(answerBuf));
}

/**
 * Sends a vdcSendPong message
 * @param  {} conn
 * @param  {} decodedMessage
 */
export function _vdcSendPong(this: libdsvdc, conn: any, decodedMessage: any) {
  let answerObj = this.vdsm.fromObject({
    type: 9,
    messageId: decodedMessage.messageId + 1,
    vdcSendPong: {dSUID: decodedMessage.vdsmSendPing.dSUID},
  });
  const answerBuf = this.vdsm.encode(answerObj).finish();
  if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
  conn.write(_addHeaders(answerBuf));
  /**
   * @event messageSent - New message sent to VDSM
   * @type {object}
   * @property Message Object
   */
  this.emitObject('messageSent', this.vdsm.decode(answerBuf));
}

/**
 * Sends a generic response
 * @param  {Object} conn
 * @param  {Object} GenericResponse
 */
export function _genericResponse(
  this: libdsvdc,
  conn: any,
  GenericResponse: any,
  messageId: any
) {
  // this.messageId = this.messageId + 1;
  if (this.debug) console.log(GenericResponse);
  const answerObj = this.vdsm.fromObject({
    type: 1,
    messageId: messageId,
    genericResponse: {GenericResponse},
  });
  const answerBuf = this.vdsm.encode(answerObj).finish();
  if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
  conn.write(_addHeaders(answerBuf));
  /**
   * @event messageSent - New message sent to VDSM
   * @type {object}
   * @property Message Object
   */
  this.emit('messageSent', this.vdsm.decode(answerBuf));
}

/**
 * Announces a new device which is then queried by the VDSM
 * @param {Object} conn
 * @param {String} dSUID - dSUID of the device which needs to be announced
 */
export function _vdcSendAnnounceDevice(
  this: libdsvdc,
  conn: any,
  dSUID: string
) {
  this.messageId = this.messageId + 1;
  const answerObj = this.vdsm.fromObject({
    type: 10,
    messageId: this.messageId,
    vdcSendAnnounceDevice: {
      dSUID: dSUID,
      vdcDSUID: this.config.vdcDSUID,
    },
  });
  const answerBuf = this.vdsm.encode(answerObj).finish();
  if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
  conn.write(_addHeaders(answerBuf));
  /**
   * @event messageSent - New message sent to VDSM
   * @type {object}
   * @property Message Object
   */
  this.emitObject('messageSent', this.vdsm.decode(answerBuf));
}

/**
 * Digitalstrom requires a 2 byte header with the lenght. This functions adds that header to the buffer
 * @param  {} buffer
 */
function _addHeaders(buffer: Uint8Array) {
  function decimalToHex(d: any, padding: number) {
    let hex = Number(d).toString(16);
    padding =
      typeof padding === 'undefined' || padding === null
        ? (padding = 2)
        : padding;

    while (hex.length < padding) {
      hex = '0' + hex;
    }

    return hex;
  }
  const h = decimalToHex(buffer.length, 4);
  const cA = [Buffer.from(h, 'hex'), buffer];
  return Buffer.concat(cA);
}
