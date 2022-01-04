"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._vdcSendAnnounceDevice = exports._genericResponse = exports._vdcSendPong = exports._vdcSendAnnounceVdc = exports._vdsmResponseHello = exports._vdcPushChannelStates = exports._vdcSendPushProperty = exports._vdcResponseGetProperty = void 0;
const messageMapping_1 = require("./messageMapping");
function _vdcResponseGetProperty(conn, decodedMessage) {
    const properties = [];
    let sendIt = true;
    if (decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase() ===
        this.config.vdcDSUID.toLowerCase()) {
        decodedMessage.vdsmRequestGetProperty.query.forEach((p) => {
            if (this.debug)
                console.log('Query', p);
            if (p.name == 'name') {
                properties.push({
                    name: 'name',
                    value: { vString: this.config.vdcName },
                });
            }
            else if (p.name == 'capabilities') {
                properties.push({
                    name: 'capabilities',
                    elements: [
                        {
                            name: 'dynamicDefinitions',
                            value: { vBool: false },
                        },
                        {
                            name: 'identification',
                            value: { vBool: true },
                        },
                        {
                            name: 'metering',
                            value: { vBool: false },
                        },
                    ],
                });
                setTimeout(() => {
                    this.emit('vdcAnnounceDevices');
                }, 10 * 1000);
            }
            else if (p.name == 'modelVersion') {
                properties.push({
                    name: 'modelVersion',
                    value: { vString: this.VERSION },
                });
            }
            else if (p.name == 'configURL' && this.config.configURL) {
                properties.push({
                    name: 'configURL',
                    value: { vString: this.config.configURL },
                });
            }
            else if (p.name == 'hardwareVersion') {
                properties.push({
                    name: 'hardwareVersion',
                    value: { vString: this.VERSION },
                });
            }
            else if (p.name == 'model') {
                properties.push({
                    name: 'model',
                    value: { vString: this.MODEL },
                });
            }
            else if (p.name == 'displayId') {
                properties.push({
                    name: 'displayId',
                    value: { vString: this.config.vdcName },
                });
            }
            else if (p.name == 'vendorName') {
                properties.push({
                    name: 'vendorName',
                    value: { vString: this.VENDORNAME },
                });
            }
        });
    }
    else {
        const device = this.devices.find((d) => d.dSUID.toLowerCase() ==
            decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase());
        if (device) {
            decodedMessage.vdsmRequestGetProperty.query.forEach((p) => {
                if (this.debug)
                    console.log('Query', p);
                if (p.name == 'outputSettings') {
                    let elements = [];
                    if (device.outputSettings) {
                        device.outputSettings.forEach((desc) => {
                            var _a;
                            elements = [];
                            for (const [key, value] of Object.entries(desc)) {
                                if (key &&
                                    messageMapping_1.outputSettings.find((o) => o.name == key)) {
                                    if (messageMapping_1.outputSettings &&
                                        ((_a = messageMapping_1.outputSettings.find((o) => o.name == key)) === null || _a === void 0 ? void 0 : _a.type) == 'elements') {
                                        const subElements = [];
                                        value.forEach((s) => {
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
                                    }
                                    else {
                                        const valObj = {};
                                        const keyObj = messageMapping_1.outputSettings.find((o) => o.name == key);
                                        const objKey = keyObj === null || keyObj === void 0 ? void 0 : keyObj.type;
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
                        });
                    }
                    if (elements.length > 0) {
                        properties.push({
                            name: 'outputSettings',
                            elements: elements,
                        });
                    }
                    else {
                    }
                    if (this.debug)
                        console.log(JSON.stringify(properties));
                }
                else if (p.name == 'outputDescription') {
                    let elements = [];
                    if (device.outputDescription) {
                        device.outputDescription.forEach((desc) => {
                            elements = [];
                            for (const [key, value] of Object.entries(desc)) {
                                if (key && messageMapping_1.outputDescription.find(o => o.name == key)) {
                                    const valObj = {};
                                    const keyObj = messageMapping_1.outputSettings.find((o) => o.name == key);
                                    const objKey = keyObj === null || keyObj === void 0 ? void 0 : keyObj.type;
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
                        });
                    }
                    if (elements.length > 0) {
                        properties.push({
                            name: 'outputDescription',
                            elements: elements,
                        });
                    }
                    else {
                    }
                }
                else if (p.name == 'buttonInputSettings') {
                    if (Array.isArray(device.buttonInputSetting)) {
                        const biElements = [];
                        device.buttonInputSetting.forEach((cdObj, i) => {
                            if (cdObj &&
                                typeof cdObj === 'object' &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                const subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                biElements.push({
                                    name: cdObj.objName,
                                    elements: subElements,
                                });
                            }
                            else {
                                properties.push({
                                    name: cdObj.objName,
                                });
                            }
                        });
                        properties.push({
                            name: p.name,
                            elements: biElements,
                        });
                    }
                    else {
                        properties.push({
                            name: p.name,
                        });
                    }
                }
                else if (p.name == 'buttonInputDescriptions') {
                    if (Array.isArray(device.buttonInputDescriptions)) {
                        const biElements = [];
                        device.buttonInputDescriptions.forEach((cdObj, i) => {
                            if (cdObj &&
                                typeof cdObj === 'object' &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                const subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                biElements.push({
                                    name: cdObj.objName,
                                    elements: subElements,
                                });
                            }
                            else {
                                properties.push({
                                    name: cdObj.objName,
                                });
                            }
                        });
                        properties.push({
                            name: p.name,
                            elements: biElements,
                        });
                    }
                    else {
                    }
                }
                else if (p.name == 'sensorDescriptions') {
                    let elements = [];
                    const sensorElements = [];
                    if (device.sensorDescriptions) {
                        device.sensorDescriptions.forEach((desc) => {
                            elements = [];
                            for (const [key, value] of Object.entries(desc)) {
                                if (key && messageMapping_1.sensorDescriptions.find(o => o.name == key)) {
                                    const valObj = {};
                                    const keyObj = messageMapping_1.outputSettings.find((o) => o.name == key);
                                    const objKey = keyObj === null || keyObj === void 0 ? void 0 : keyObj.type;
                                    valObj[objKey] = value;
                                    elements.push({
                                        name: key,
                                        value: valObj,
                                    });
                                    if (this.debug) {
                                        console.log('ADDED ELEMENTS SENSOR', JSON.stringify(elements));
                                    }
                                }
                            }
                            sensorElements.push({
                                name: desc.objName,
                                elements: elements,
                            });
                        });
                    }
                    if (elements.length > 0) {
                        properties.push({
                            name: 'sensorDescriptions',
                            elements: sensorElements,
                        });
                    }
                    else {
                        properties.push({
                            name: 'sensorDescriptions',
                        });
                    }
                }
                else if (p.name == 'zoneID') {
                    properties.push({
                        name: p.name,
                        value: {
                            vUint64: device.zoneID || 65534,
                        },
                    });
                }
                else if (p.name == 'binaryInputDescriptions') {
                    if (Array.isArray(device.binaryInputDescriptions)) {
                        const biElements = [];
                        device.binaryInputDescriptions.forEach((cdObj, i) => {
                            if (cdObj &&
                                typeof cdObj === 'object' &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                const subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                biElements.push({
                                    name: cdObj.objName,
                                    elements: subElements,
                                });
                            }
                            else {
                                properties.push({
                                    name: cdObj.objName,
                                });
                            }
                        });
                        properties.push({
                            name: p.name,
                            elements: biElements,
                        });
                    }
                    else {
                        properties.push({
                            name: p.name,
                            elements: [{ name: '' }],
                        });
                    }
                }
                else if (p.name == 'binaryInputSettings') {
                    if (Array.isArray(device.binaryInputSettings)) {
                        const biElements = [];
                        device.binaryInputSettings.forEach((cdObj, i) => {
                            if (cdObj &&
                                typeof cdObj === 'object' &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                const subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                biElements.push({
                                    name: cdObj.objName,
                                    elements: subElements,
                                });
                            }
                            else {
                                properties.push({
                                    name: 'generic',
                                });
                            }
                        });
                        properties.push({
                            name: p.name,
                            elements: biElements,
                        });
                    }
                    else {
                        properties.push({
                            name: p.name,
                        });
                    }
                }
                else if (p.name == 'sensorSettings') {
                    if (Array.isArray(device.sensorSettings)) {
                        const biElements = [];
                        device.sensorSettings.forEach((cdObj, i) => {
                            if (cdObj &&
                                typeof cdObj === 'object' &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                const subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                biElements.push({
                                    name: cdObj.objName,
                                    elements: subElements,
                                });
                            }
                            else {
                                properties.push({
                                    name: `generic`,
                                });
                            }
                        });
                        properties.push({
                            name: p.name,
                            elements: biElements,
                        });
                    }
                    else {
                        properties.push({
                            name: p.name,
                        });
                    }
                }
                else if (p.name == 'deviceActionDescriptions') {
                    properties.push({
                        name: p.name,
                    });
                }
                else if (p.name == 'customActions') {
                    properties.push({
                        name: p.name,
                    });
                }
                else if (p.name == 'dynamicActionDescriptions') {
                    properties.push({
                        name: p.name,
                    });
                }
                else if (p.name == 'deviceStates') {
                    properties.push({
                        name: p.name,
                    });
                }
                else if (p.name == 'deviceProperties') {
                    properties.push({
                        name: p.name,
                    });
                }
                else if (p.name == 'channelDescriptions') {
                    if (Array.isArray(device.channelDescriptions)) {
                        device.channelDescriptions.forEach((cdObj) => {
                            if (cdObj &&
                                typeof cdObj === 'object' &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                const subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                properties.push({
                                    name: p.name,
                                    elements: subElements,
                                });
                            }
                            else {
                                properties.push({
                                    name: p.name,
                                });
                            }
                        });
                    }
                    else {
                        properties.push({
                            name: p.name,
                        });
                    }
                }
                else if (p.name == 'deviceIcon16') {
                    properties.push({
                        name: 'deviceIcon16',
                        value: {
                            vBytes: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAJZlWElmTU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgExAAIAAAARAAAAWodpAAQAAAABAAAAbAAAAAAAAAAaAAAAAQAAABoAAAABd3d3Lmlua3NjYXBlLm9yZwAAAAOgAQADAAAAAQABAACgAgAEAAAAAQAAABCgAwAEAAAAAQAAABAAAAAAlOnVuQAAAAlwSFlzAAAEAAAABAABGSOaawAAAi1pVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDYuMC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+d3d3Lmlua3NjYXBlLm9yZzwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj4yNjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+MjY8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpHDvotAAADJElEQVQ4EU1TXWhcVRCeOefu3b272eaP3bWxaKs2NlEUqX1I0QfZtSUISrWLYiKEUHxr8UHz44sLIklarG0kIUJBNAqtAS2ipqWxSYkRn/QtNE2Tgj+NSRbSZHdz9+bee44zew3NPJw7d2a+OfPNnEFgyWYljI35rD54/KN0cfZOZvexI/9U7dv/IYCObMzdPJmfnHnCTOy6/O943w2O28ZIyOUEDA8rCsRE2j6PwhzSSj1nNSQXI4nUAQAMOct355214rsojY7Y3sMPlBZ/+RFmZzUnkTA1pRmczPSMy8iuNlA+aK98ydr78IhZUzdHvqly/t64c/evemGGm9G0no0+dOj50uLMl5xEcDWpF3vPyWjtUeUU1tHA9vz0uTfijU0CtD+IQp6vb3rSX73xcRb11muqXHBkJJ5OZro+Y6xIZHqeARk65dv36DLdsfT9B1+zA1w3Sm5JZYOnHItNS1f6vtUoXlVumZjJt5Pp3haBACeEGSMwjK78fPryI93fVHOw0oKayuw0CFTUI4A92bPW6rW+n7TnfkV0KYl6ixLoF7RrUxfwYgXohCgngCG8ypd1gFDlTNXGPFZQ4+dasapbBN3RqN3yllZwm51hk28G8CqhrN2XeEMjhZMY3h3ql4+AzdzE4CZF/ztFGEHwDluiefV/WySwEoJ7cAtDERMkPsZWUxQN/gYUyItE0g/oLE6sVaZG9e0T4bik9swyhUk0IiAAX2fgOh8kWoSYhEtgUEZA6297w6z4FHTSeEnF34RS6oJyNxnSnkh3Hf+zv22Ng7xCoYZGGJbhKKjiZpxty6PvlVKZ7ldQiDa/XOBRjYr89TO/g+8O0kNCkqGGl3OdHFzT9PQcol72nVKp7qmD82xLHX3/Tar4i2DsemTl+sCvQeNoH5LT9g8yVtvq20TC976TUWs81vioLxSI4sKC9kr2S2gYx0SkGvzNtasrEwOtlFPj9lbxUqVmNj8BYZ4S4SpQWzb4xQ2bYkBWVVvCtEA5JUq+9enyhPUOQE4xNqhgxzrz0ybjicoDE/g4l45Kz2nASSr/wupE/x9sq2xxLqf+A2GBUyR9ZHesAAAAAElFTkSuQmCC',
                        },
                    });
                }
                else if (p.name == 'binaryInputStates') {
                    const message = {
                        dSUID: device.dSUID,
                        value: 0,
                        messageId: decodedMessage.messageId,
                    };
                    this.emitObject('binaryInputStateRequest', message);
                    sendIt = false;
                }
                else if (p.name == 'sensorStates') {
                    const message = {
                        dSUID: device.dSUID,
                        value: 0,
                        messageId: decodedMessage.messageId,
                    };
                    this.emitObject('sensorStatesRequest', message);
                    sendIt = false;
                }
                else if (p.name == 'primaryGroup') {
                    properties.push({
                        name: 'primaryGroup',
                        value: { vUint64: device.primaryGroup },
                    });
                }
                else if (p.name == 'name') {
                    properties.push({
                        name: 'name',
                        value: { vString: device.name },
                    });
                }
                else if (p.name == 'vendorName') {
                    if (device.vendorName) {
                        properties.push({
                            name: 'vendorName',
                            value: { vString: device.vendorName },
                        });
                    }
                }
                else if (p.name == 'vendorId') {
                    if (device.vendorId) {
                        properties.push({
                            name: 'vendorId',
                            value: { vString: device.vendorId },
                        });
                    }
                }
                else if (p.name == 'configURL') {
                    if (device.configURL) {
                        properties.push({
                            name: 'configURL',
                            value: { vString: device.configURL },
                        });
                    }
                }
                else if (p.name == 'modelFeatures') {
                    if (device.modelFeatures &&
                        typeof device.modelFeatures === 'object' &&
                        !Array.isArray(device.modelFeatures) &&
                        device.modelFeatures !== null) {
                        const subElements = (0, messageMapping_1.createSubElements)(device.modelFeatures);
                        properties.push({
                            name: p.name,
                            elements: subElements,
                        });
                    }
                    else {
                        properties.push({
                            name: p.name,
                        });
                    }
                }
                else if (p.name == 'displayId') {
                    properties.push({
                        name: 'displayId',
                        value: { vString: device.displayId },
                    });
                }
                else if (p.name == 'model') {
                    properties.push({
                        name: p.name,
                        value: { vString: device.model },
                    });
                }
                else if (p.name == 'modelUID') {
                    properties.push({
                        name: p.name,
                        value: { vString: device.modelUID },
                    });
                }
                else if (p.name == 'modelVersion') {
                    properties.push({
                        name: p.name,
                        value: { vString: device.modelVersion },
                    });
                }
                else if (p.name == 'name') {
                    properties.push({
                        name: p.name,
                        value: { vString: device.name },
                    });
                }
                else if (p.name == 'channelStates') {
                    const messageNames = [];
                    p.elements.forEach((el) => {
                        if (device.channelDescription[0][el.name]) {
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
        }
        else {
            if (this.debug) {
                console.error(`Device ${decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase()} not found in devicelist`);
                if (this.debug)
                    console.log(`Device ${decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase()} not found in devicelist`);
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
        console.log(JSON.stringify({
            type: 5,
            messageId: decodedMessage.messageId,
            vdcResponseGetProperty: { properties },
        }));
        const answerObj = this.vdsm.fromObject({
            type: 5,
            messageId: decodedMessage.messageId,
            vdcResponseGetProperty: { properties },
        });
        const answerBuf = this.vdsm.encode(answerObj).finish();
        if (this.debug)
            console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
        conn.write(_addHeaders(answerBuf));
        this.emitObject('messageSent', this.vdsm.decode(answerBuf));
    }
}
exports._vdcResponseGetProperty = _vdcResponseGetProperty;
function _vdcSendPushProperty(conn, message = {
    obj: undefined,
    dSUID: '',
}) {
    this.messageId = this.messageId + 1;
    const answerObj = this.vdsm.fromObject({
        type: 12,
        messageId: this.messageId,
        vdcSendPushProperty: { dSUID: message.dSUID, properties: message.obj },
    });
    const answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    this.emit('messageSent', this.vdsm.decode(answerBuf));
}
exports._vdcSendPushProperty = _vdcSendPushProperty;
function _vdcPushChannelStates(conn, message) {
    conn.write(_addHeaders(message));
    this.emit('messageSent', this.vdsm.decode(message));
}
exports._vdcPushChannelStates = _vdcPushChannelStates;
function _vdsmResponseHello(conn, decodedMessage) {
    const answerObj = this.vdsm.fromObject({
        type: 3,
        messageId: decodedMessage.messageId,
        vdcResponseHello: { dSUID: this.config.vdcDSUID },
    });
    const answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    this.emitObject('messageSent', this.vdsm.decode(answerBuf));
}
exports._vdsmResponseHello = _vdsmResponseHello;
function _vdcSendAnnounceVdc(conn) {
    this.messageId = this.messageId + 1;
    let answerObj = this.vdsm.fromObject({
        type: 23,
        messageId: this.messageId,
        vdcSendAnnounceVdc: { dSUID: this.config.vdcDSUID },
    });
    const answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    this.emitObject('messageSent', this.vdsm.decode(answerBuf));
}
exports._vdcSendAnnounceVdc = _vdcSendAnnounceVdc;
function _vdcSendPong(conn, decodedMessage) {
    let answerObj = this.vdsm.fromObject({
        type: 9,
        messageId: decodedMessage.messageId + 1,
        vdcSendPong: { dSUID: decodedMessage.vdsmSendPing.dSUID },
    });
    const answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    this.emitObject('messageSent', this.vdsm.decode(answerBuf));
}
exports._vdcSendPong = _vdcSendPong;
function _genericResponse(conn, GenericResponse, messageId) {
    if (this.debug)
        console.log(GenericResponse);
    const answerObj = this.vdsm.fromObject({
        type: 1,
        messageId: messageId,
        genericResponse: { GenericResponse },
    });
    const answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    this.emit('messageSent', this.vdsm.decode(answerBuf));
}
exports._genericResponse = _genericResponse;
function _vdcSendAnnounceDevice(conn, dSUID) {
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
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    this.emitObject('messageSent', this.vdsm.decode(answerBuf));
}
exports._vdcSendAnnounceDevice = _vdcSendAnnounceDevice;
function _addHeaders(buffer) {
    function decimalToHex(d, padding) {
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
//# sourceMappingURL=dsCommunication.js.map