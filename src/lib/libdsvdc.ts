import {DSEventEmitter} from './DSEventEmitter';
import {getFreePort} from './libdsutil';
import * as net from 'net';
import * as dnssd from 'dnssd';
import * as path from 'path';
import * as protobuf from 'protobufjs';
import {Root, Type} from 'protobufjs';
import {
  _genericResponse,
  _vdcPushChannelStates,
  _vdcSendAnnounceVdc,
  _vdcSendPong,
  _vdcSendPushProperty,
  _vdsmResponseHello,
  _vdcSendAnnounceDevice,
  _vdcResponseGetProperty,
} from './dsCommunication';

import {createSubElements} from './messageMapping';

interface VDC {
  start(config: dsVDCConfig, devices: any): Promise<dsVDCStart>;
  sendUpdate(dSUID: string, obj: any): void;
  sendVanish(dSUID: string): void;
  sendBinaryInputState(inputStates: any, messageId: number): void;
  sendSensorStatesRequest(sensorStates: any, messageId: number): void;
  sendComplexState(messageId: number, rawSubElements: any): void;
  sendState(stateValue: any, messageId: number): void;
}

interface dsVDCConfig {
  debug: boolean | undefined;
  vdcDSUID: string;
  vdcName: string;
  port: number;
  configURL: string;
  captureRejections?: boolean | undefined;
}

interface dsVDCStart {
  error: number;
  text: string;
}

export class libdsvdc extends DSEventEmitter implements VDC {
  config: dsVDCConfig;
  debug: boolean | undefined;
  devices: any | undefined;
  messageId: number;
  private readonly messagePath: string;
  private root: Root;
  vdsm: Type;
  VERSION: string;
  MODEL: string;
  VENDORNAME: string;

  public _vdcSendPushProperty = _vdcSendPushProperty;
  public _vdcPushChannelStates = _vdcPushChannelStates;
  public _vdsmResponseHello = _vdsmResponseHello;
  public _vdcSendAnnounceVdc = _vdcSendAnnounceVdc;
  public _vdcSendPong = _vdcSendPong;
  public _genericResponse = _genericResponse;
  public _vdcSendAnnounceDevice = _vdcSendAnnounceDevice;
  public _vdcResponseGetProperty = _vdcResponseGetProperty;

  constructor(config: dsVDCConfig) {
    super(config);
    this.config = config;
    this.debug = config.debug;
    this.messageId = 0;
    this.messagePath = path.join(__dirname, '/messages/messages.proto');
    this.root = protobuf.loadSync(this.messagePath);
    this.vdsm = this.root.lookupType('Message');
    this.VERSION = '0.0.1';
    this.MODEL = 'ioBroker VDC';
    this.VENDORNAME = 'KYUKA';
    /* setTimeout(() => {
      this.emitGetState('test', 'blah.0.test', this._MyCallback.bind(this));
    }, 5 * 1000); */
  }

  /* private static _MyCallback(args: string) {
    console.log(args);
  } */

  /**
   * Start a new instance of a VDC
   * @param {Object} config
   * @param {Array} devices
   */
  public async start(config: dsVDCConfig, devices = {}): Promise<dsVDCStart> {
    if (!config.vdcDSUID || config.vdcDSUID.length != 34) {
      // no vdcDSUID set -> exiting
      return {error: 99, text: 'vdcDSUID missing'};
    } else {
      this.config.vdcDSUID = config.vdcDSUID;
    }
    if (!config.vdcName || config.vdcName.length <= 0) {
      // no name set -> existing
      return {error: 99, text: 'vdcName missing'};
    } else {
      this.config.vdcName = config.vdcName;
    }
    if (!config.port) {
      this.config.port = await getFreePort();
      if (this.debug)
        console.log('No port provided -> using %d', this.config.port);
    } else {
      this.config.port = config.port;
    }

    this.devices = devices;

    const handleConnection = (conn: any) => {
      let remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
      if (this.debug)
        console.log('new client connection from %s', remoteAddress);

      const onConnData = (d: any) => {
        if (this.debug)
          console.log(
            '\n---------------------------\nconnection data from %s: %j',
            remoteAddress,
            d
          );

        try {
          let decodedMessage: any;
          decodedMessage = this.vdsm.decode(d.slice(2));
          /**
           * @event messageReceived - New message received from VDSM
           * @type {Object}
           * @property {Object} Message Object
           */
          this.emitObject('messageReceived', decodedMessage);
          if (this.debug) console.log(JSON.stringify(decodedMessage));
          // let answerBuf = null;
          if (decodedMessage.type == 2) {
            // VDSM_REQUEST_HELLO
            // send RESPONSE HELLO
            this._vdsmResponseHello(conn, decodedMessage);
            // send vdcAnnounceVdc
            this._vdcSendAnnounceVdc(conn);
            // send announcedevice for each device
            /* if (self.devices && self.devices.length > 0) {
                          self.devices.forEach((dev) => {
                            if (dev.dSUID && dev.dSUID.length > 0) {
                              self._vdcSendAnnounceDevice(conn, dev.dSUID);
                            }
                          });
                        } */
          } else if (decodedMessage.type == 8) {
            // VDSM_SEND_PING
            // send VDC_SEND_PONG
            this._vdcSendPong(conn, decodedMessage);
          } else if (decodedMessage.type == 4) {
            // VDSM_REQUESTGETPROPERTIES
            // send _vdcResponseGetProperty
            this._vdcResponseGetProperty(conn, decodedMessage);
          } else if (decodedMessage.type == 6) {
            // VDSM_REQUEST_SET_PROPERTY
            // TODO implement logic
            // search for device and store the zone there
            const device = this.devices.find(
              (d: any) =>
                d.dSUID.toLowerCase() ==
                decodedMessage.vdsmRequestSetProperty.dSUID.toLowerCase()
            );
            if (this.debug)
              console.log('DEVICE TO UPDATE FOUND', JSON.stringify(device));
            if (device) {
              // device found
              if (
                decodedMessage.vdsmRequestSetProperty.properties[0].name ==
                'zoneID'
              ) {
                device.zoneID =
                  decodedMessage.vdsmRequestSetProperty.properties[0].value.vUint64.toString() ||
                  65534;
                this.emitObject('deviceZoneChange', {
                  request: decodedMessage.vdsmRequestSetProperty,
                  devices: this.devices,
                });
              } else {
                if (this.debug)
                  console.log('DEVICE BEFORE UPDATE', JSON.stringify(device));
                decodedMessage.vdsmRequestSetProperty.properties.forEach(
                  (p: any) => {
                    if (device[p.name]) {
                      if (this.debug)
                        console.log(
                          `found parameters ${
                            p.name
                          } to upgrade in ${JSON.stringify(device)}`
                        );
                      p.elements.forEach((el: any) => {
                        const valueObj = device[p.name].find(
                          (o: any) => o.objName == el.name
                        );
                        if (this.debug)
                          console.log(
                            `Found parameter ${
                              el.name
                            } in object ${JSON.stringify(valueObj)} in device`
                          );
                        if (valueObj) {
                          el.elements.forEach((ce: any) => {
                            let newValue: string = '';
                            Object.keys(ce.value).forEach(v => {
                              newValue = ce.value[v];
                            });
                            if (this.debug)
                              console.log(
                                `setting value ${newValue} on ${JSON.stringify(
                                  valueObj
                                )} on parameter ${ce.name}`
                              );
                            valueObj[ce.name] = newValue.toString();
                          });
                        }
                      });
                    }
                    if (this.debug)
                      console.log(
                        'DEVICE AFTER UPDATE',
                        JSON.stringify(device)
                      );
                    this.emitObject('updateDeviceValues', device);
                  }
                );
              }
            }
            this._genericResponse(
              conn,
              {code: 0, description: 'OK'},
              decodedMessage.messageId
            );
          } else if (decodedMessage.type == 1) {
            this._parseGenericResponse(decodedMessage);
          } else if (decodedMessage.type == 15) {
            // VDSM_NOTIFICATION_CALL_SCENE = 15;
            if (decodedMessage.vdsmSendCallScene) {
              this.emitObject(
                'VDSM_NOTIFICATION_CALL_SCENE',
                decodedMessage.vdsmSendCallScene
              );
            }
          } else if (decodedMessage.type == 16) {
            // VDSM_NOTIFICATION_SAVE_SCENE = 16;
            if (decodedMessage.vdsmSendSaveScene) {
              this.emitObject(
                'VDSM_NOTIFICATION_SAVE_SCENE',
                decodedMessage.vdsmSendSaveScene
              );
            }
          } else if (decodedMessage.type == 17) {
            // VDSM_NOTIFICATION_UNDO_SCENE = 17;
          } else if (decodedMessage.type == 21) {
            // VDSM_NOTIFICATION_SET_CONTROL_VALUE
            if (decodedMessage.vdsmSendSetControlValue) {
              this.emitObject(
                'VDSM_NOTIFICATION_SET_CONTROL_VALUE',
                decodedMessage.vdsmSendSetControlValue
              );
            }
          } else if (decodedMessage.type == 25) {
            // VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE
            if (decodedMessage.vdsmSendOutputChannelValue) {
              this.emitObject(
                'VDSM_NOTIFICATION_SET_OUTPUT_CHANNEL_VALUE',
                decodedMessage.vdsmSendOutputChannelValue
              );
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      const onConnClose = () => {
        if (this.debug) console.log('connection from %s closed', remoteAddress);
      };
      const onConnError = (err: any) => {
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
          this.devices.forEach((dev: any) => {
            if (dev.dSUID && dev.dSUID.length > 0) {
              this._vdcSendAnnounceDevice(conn, dev.dSUID);
            }
          });
        }
      });
    };

    const server = net.createServer();
    server.on('connection', handleConnection);
    server.listen({port: this.config.port}, () => {
      if (this.debug) console.log('server listening to %j', server.address());
    });
    // advertise server
    this._initDNSSD();
    setImmediate(() => {
      /**
       * @event vdcRunningState - Sent when the VDC is fully initialized
       */
      this.emitObject('vdcRunningState', {running: true});
    });
    console.log(`VDC initialized on port ${this.config.port} and running`);

    return {
      error: 0,
      text: `VDC initialized on port ${this.config.port} and running`,
    };
  }

  private _initDNSSD() {
    const serviceType = new dnssd.ServiceType('_ds-vdc._tcp');
    if (this.debug) console.log(serviceType);
    const ad = new dnssd.Advertisement(serviceType, this.config.port, {
      name: this.config.vdcName,
      txt: {dSUID: this.config.vdcDSUID},
    });
    ad.start()
      .on('error', err => {
        if (this.debug) console.log('Error:', err);
      })
      .on('stopped', stop => {
        if (this.debug) console.log('Stopped', stop);
      })
      .on('instanceRenamed', instanceRenamed => {
        if (this.debug) console.log('instanceRenamed', instanceRenamed);
      })
      .on('hostRenamed', hostRenamed => {
        if (this.debug) console.log('hostRenamed', hostRenamed);
      });
  }

  /**
   * Parse genericResponse to show errors
   * @param {Object} decodedMessage
   */
  _parseGenericResponse(decodedMessage: any) {
    interface errorMapping {
      [key: string]: string;
    }
    const errorMapping: errorMapping = {
      ERR_OK: 'Everything alright',
      ERR_MESSAGE_UNKNOWN:
        'The message id is unknown. This might happen due to incomplete or incompatible implementation',
      ERR_INCOMPATIBLE_API:
        'The API version of the VDSM is not compatible with this VDC.',
      ERR_SERVICE_NOT_AVAILABLE:
        'The VDC cannot respond. Might happen bcause the VDC is already connected to another VDSM.',
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
    if (
      decodedMessage &&
      decodedMessage.genericResponse &&
      decodedMessage.genericResponse.code
    ) {
      if (this.debug) {
        const code: string = decodedMessage.genericResponse.code as string;
        console.info(
          `Generic response with message ${errorMapping[code]} received`
        );
      }
    }
  }

  sendUpdate(dSUID: string, obj: any) {
    this.emitObject('vdcSendPushProperty', {dSUID, obj});
  }

  sendState(stateValue: any, messageId: number) {
    const properties = [];
    const subElements = createSubElements({
      0: {age: 1, value: stateValue},
    });
    properties.push({
      name: 'channelStates',
      elements: subElements,
    });

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
    if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    // conn.write(this._addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property {object} Message Object
     */
    this.emitObject('vdcPushChannelStates', answerBuf);
    this.emitObject('messageSent', this.vdsm.decode(answerBuf));
  }

  sendComplexState(messageId: number, rawSubElements: any) {
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
    if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    // conn.write(this._addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property {object} Message Object
     */
    this.emitObject('vdcPushChannelStates', answerBuf);
    this.emitObject('messageSent', this.vdsm.decode(answerBuf));
  }

  sendSensorStatesRequest(sensorStates: any, messageId: number) {
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
      if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
      // conn.write(this._addHeaders(answerBuf));
      /**
       * @event messageSent - New message sent to VDSM
       * @type {object}
       * @property {object} Message Object
       */
      this.emitObject('vdcPushChannelStates', answerBuf);
      this.emitObject('messageSent', this.vdsm.decode(answerBuf));
    }
  }

  sendBinaryInputState(inputStates: any, messageId: number) {
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
      if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
      // conn.write(this._addHeaders(answerBuf));
      /**
       * @event messageSent - New message sent to VDSM
       * @type {object}
       * @property {object} Message Object
       */
      this.emitObject('vdcPushChannelStates', answerBuf);
      this.emitObject('messageSent', this.vdsm.decode(answerBuf));
    }
  }

  sendVanish(dSUID: string) {
    const properties = [];
    this.messageId = this.messageId + 1;
    properties.push({
      dSUID: dSUID,
    });
    const answerObj = this.vdsm.fromObject({
      type: 11,
      messageId: this.messageId,
      vdcSendVanish: {properties},
    });
    const answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug) console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    // conn.write(this._addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property {object} Message Object
     */
    this.emitObject('vdcPushChannelStates', answerBuf);
    this.emitObject('messageSent', this.vdsm.decode(answerBuf));
  }
}
