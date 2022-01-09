export const binaryInputDescriptions = [
  {
    name: 'aliveSignInterval',
    type: 'vDouble',
  },
  {
    name: 'dsIndex',
    type: 'vUint64',
  },
  {
    name: 'inputType',
    type: 'vUint64',
  },
  {
    name: 'inputUsage',
    type: 'vUint64',
  },
  {
    name: 'maxPushInterval',
    type: 'vDouble',
  },
  {
    name: 'name',
    type: 'vString',
  },
  {
    name: 'sensorFunction',
    type: 'vUint64',
  },
  {
    name: 'type',
    type: 'vString',
  },
  {
    name: 'updateInterval',
    type: 'vDouble',
  },
  {
    name: 'x-nvdc-behaviourType',
    type: 'vString',
  },
];

export const outputDescription = [
  {
    name: 'dsIndex',
    type: 'vUint64',
  },
  {
    name: 'name',
    type: 'vString',
  },
  {
    name: 'function',
    type: 'vUint64',
  },
  {
    name: 'outputUsage',
    type: 'vUint64',
  },
  {
    name: 'type',
    type: 'vString',
  },
  {
    name: 'variableRamp',
    type: 'vBool',
  },
  {
    name: 'x-nvdc-behaviourType',
    type: 'vString',
  },
];

export const outputSettings: Array<globalHelperItem> = [
  {
    name: 'dimTimeDown',
    type: 'vUint64',
  },
  {
    name: 'dimTimeDownAlt1',
    type: 'vUint64',
  },
  {
    name: 'dimTimeDownAlt2',
    type: 'vUint64',
  },
  {
    name: 'dimTimeUp',
    type: 'vUint64',
  },
  {
    name: 'dimTimeUpAlt1',
    type: 'vUint64',
  },
  {
    name: 'dimTimeUpAlt2',
    type: 'vUint64',
  },
  {
    name: 'minBrightness',
    type: 'vDouble',
  },
  {
    name: 'onThreshold',
    type: 'vDouble',
  },
  {
    name: 'x-nvdc-dimCurveExp',
    type: 'vDouble',
  },
  {
    name: 'groups',
    type: 'elements',
  },
  {
    name: 'mode',
    type: 'vUint64',
  },
  {
    name: 'pushChanges',
    type: 'vBool',
  },
  {
    name: 'x-nvdc-behaviourType',
    type: 'vString',
  },
];

export const sensorDescriptions = [
  {
    name: 'aliveSignInterval',
    type: 'vDouble',
  },
  {
    name: 'dsIndex',
    type: 'vUint64',
  },
  {
    name: 'max',
    type: 'vDouble',
  },
  {
    name: 'maxPushInterval',
    type: 'vDouble',
  },
  {
    name: 'min',
    type: 'vDouble',
  },
  {
    name: 'name',
    type: 'vString',
  },
  {
    name: 'resolution',
    type: 'vDouble',
  },
  {
    name: 'sensorType',
    type: 'vUint64',
  },
  {
    name: 'sensorUsage',
    type: 'vUint64',
  },
  {
    name: 'siunit',
    type: 'vString',
  },
  {
    name: 'symbol',
    type: 'vString',
  },
  {
    name: 'type',
    type: 'vString',
  },
  {
    name: 'updateInterval',
    type: 'vDouble',
  },
  {
    name: 'x-nvdc-behaviourType',
    type: 'vString',
  },
];

export const channelDescription = [
  {
    name: 'brightness',
    elements: [
      {name: 'channelType', value: {vUint64: '1'}},
      {name: 'dsIndex', value: {vUint64: '0'}},
      {name: 'max', value: {vDouble: 100}},
      {name: 'min', value: {vDouble: 0}},
      {name: 'name', value: {vString: 'brightness'}},
      {name: 'resolution', value: {vDouble: 0.39215686274509803}},
      {name: 'siunit', value: {vString: 'percent'}},
      {name: 'symbol', value: {vString: '%'}},
    ],
  },
];

export interface globalHelperItem {
  name: string;
  type: string;
}
export const globalHelper: Array<globalHelperItem> = [
  {
    name: 'channelType',
    type: 'vUint64',
  },
  {
    name: 'dsIndex',
    type: 'vUint64',
  },
  {
    name: 'max',
    type: 'vDouble',
  },
  {
    name: 'error',
    type: 'vUint64',
  },
  {
    name: 'min',
    type: 'vDouble',
  },
  {
    name: 'name',
    type: 'vString',
  },
  {
    name: 'resolution',
    type: 'vDouble',
  },
  {
    name: 'siunit',
    type: 'vString',
  },
  {
    name: 'symbol',
    type: 'vString',
  },
  {
    name: 'aliveSignInterval',
    type: 'vDouble',
  },
  {
    name: 'inputType',
    type: 'vUint64',
  },
  {
    name: 'inputUsage',
    type: 'vUint64',
  },
  {
    name: 'maxPushInterval',
    type: 'vDouble',
  },
  {
    name: 'minPushInterval',
    type: 'vDouble',
  },
  {
    name: 'sensorFunction',
    type: 'vUint64',
  },
  {
    name: 'function',
    type: 'vUint64',
  },
  {
    name: 'type',
    type: 'vString',
  },
  {
    name: 'updateInterval',
    type: 'vDouble',
  },
  {
    name: 'changesOnlyInterval',
    type: 'vDouble',
  },
  {
    name: 'group',
    type: 'vUint64',
  },
  {name: 'blink', type: 'vBool'},
  {name: 'dontcare', type: 'vBool'},
  {name: 'ignoreLocalPriority', type: 'vBool'},
  {name: 'effect', type: 'vUint64'},
  {name: 'identification', type: 'vBool'},
  {name: 'outmode', type: 'vBool'},
  {name: 'outputchannels', type: 'vBool'},
  {name: 'highlevel', type: 'vBool'},
  {name: 'akminput', type: 'vBool'},
  {name: 'jokerconfig', type: 'vBool'},
  {name: 'akmsensor', type: 'vBool'},
  {name: 'optypeconfig', type: 'vBool'},
  {name: 'akmdelay', type: 'vBool'},
  {name: 'outvalue8', type: 'vBool'},
  {name: 'transt', type: 'vBool'},
  {name: 'pushbutton', type: 'vBool'},
  {name: 'pushbarea', type: 'vBool'},
  {name: 'pushbdevice', type: 'vBool'},
  {name: 'pushbadvanced', type: 'vBool'},
  {name: 'twowayconfig', type: 'vBool'},
  {name: 'deviceIcon16', type: 'vBytes'},
  {name: 'deviceIconName', type: 'vString'},
  {name: 'value', type: 'vDouble'},
  {name: 'value_boolean', type: 'vBool'},
  {name: 'age', type: 'vDouble'},
  {name: 'extendedValue', type: 'vUint64'},
  {name: 'supportsLocalKeyMode', type: 'vBool'},
  {name: 'buttonID', type: 'vUint64'},
  {name: 'buttonType', type: 'vUint64'},
  {name: 'buttonElementID', type: 'vUint64'},
  {name: 'buttonElementID', type: 'vUint64'},
  {name: 'mode', type: 'vUint64'},
  {name: 'channel', type: 'vUint64'},
  {name: 'setsLocalPriority', type: 'vBool'},
  {name: 'callsPresent', type: 'vBool'},
  {name: 'combinables', type: 'vUint64'},
  {name: 'x-p44-behaviourType', type: 'vString'},
  {name: 'x-p44-buttonActionId', type: 'vUint64'},
  {name: 'x-p44-buttonActionMode', type: 'vUint64'},
  {name: 'x-p44-longFunctionDelay', type: 'vUint64'},
  {name: 'x-p44-stateMachineMode', type: 'vUint64'},
];

export function lookupType(key: string, value: any) {
  let type = null;
  if (!key) return type;
  if (globalHelper.find(o => o.name == key)) {
    let valObj: any = {};
    if (
      typeof value != 'undefined' &&
      ((value && value.length > 0) || value === 0 || value)
    ) {
      if (globalHelper) {
        const gHI = globalHelper.find((o: globalHelperItem) => o.name == key);
        if (gHI) {
          const typeKey: string = gHI.type;
          if (typeKey) {
            valObj[typeKey] = value;
            type = valObj;
          }
        }
      }
    } else if (value == '') {
      type = valObj;
      // type = valObj;
    } else {
      // do nothing
    }
  }
  return type;
}

export function createSubElements(obj: any): any {
  const subElements = [];
  for (let [key, value] of Object.entries(obj)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      value !== null
    ) {
      // we have an array as a value -> recursive it
      const deepElements = [];
      deepElements.push(createSubElements(value));
      subElements.push({
        name: key,
        elements: deepElements[0],
      });
    } else {
      if (key && globalHelper.find(o => o.name == key)) {
        const val = lookupType(key, value);
        if (key.includes('_')) {
          const actualKey = key.split('_');
          if (val) {
            subElements.push({
              name: actualKey[0],
              value: val,
            });
          } else {
            subElements.push({
              name: actualKey[0],
            });
          }
        } else {
          if (val) {
            subElements.push({
              name: key,
              value: val,
            });
          } else {
            subElements.push({
              name: key,
            });
          }
        }
      }
    }
  }
  return subElements;
}
