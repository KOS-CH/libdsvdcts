"use strict";
exports.__esModule = true;
exports._vdcSendAnnounceDevice = exports._genericResponse = exports._vdcSendPong = exports._vdcSendAnnounceVdc = exports._vdsmResponseHello = exports._vdcPushChannelStates = exports._vdcSendPushProperty = exports._vdcResponseGetProperty = void 0;
var messageMapping_1 = require("./messageMapping");
/**
 * Parses the vdsmGetProperty message to add values wherever it's known
 * @param  {} conn
 * @param  {Object} decodedMessage
 */
function _vdcResponseGetProperty(conn, decodedMessage) {
    var _this = this;
    var properties = [];
    var sendIt = true;
    if (decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase() ===
        this.config.vdcDSUID.toLowerCase()) {
        // this is our VDC -> no lookup for devices
        decodedMessage.vdsmRequestGetProperty.query.forEach(function (p) {
            if (_this.debug)
                console.log("Query", p);
            if (p.name == "name") {
                properties.push({
                    name: "name",
                    value: { vString: _this.config.vdcName }
                });
            }
            else if (p.name == "capabilities") {
                properties.push({
                    name: "capabilities",
                    elements: [
                        {
                            name: "dynamicDefinitions",
                            value: { vBool: false }
                        },
                        {
                            name: "identification",
                            value: { vBool: true }
                        },
                        {
                            name: "metering",
                            value: { vBool: false }
                        },
                    ]
                });
                // start timer to announce devices ...
                setTimeout(function () {
                    _this.emit("vdcAnnounceDevices");
                }, 10 * 1000);
            }
            else if (p.name == "modelVersion") {
                properties.push({
                    name: "modelVersion",
                    value: { vString: _this.VERSION }
                });
            }
            else if (p.name == "configURL" && _this.config.configURL) {
                properties.push({
                    name: "configURL",
                    value: { vString: _this.config.configURL }
                });
            }
            else if (p.name == "hardwareVersion") {
                properties.push({
                    name: "hardwareVersion",
                    value: { vString: _this.VERSION }
                });
            }
            else if (p.name == "model") {
                properties.push({
                    name: "model",
                    value: { vString: _this.MODEL }
                });
            }
            else if (p.name == "displayId") {
                properties.push({
                    name: "displayId",
                    value: { vString: _this.config.vdcName }
                });
            }
            else if (p.name == "vendorName") {
                properties.push({
                    name: "vendorName",
                    value: { vString: _this.VENDORNAME }
                });
            }
        });
    }
    else {
        // lookup device array for properties
        var device_1 = this.devices.find(function (d) {
            return d.dSUID.toLowerCase() ==
                decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase();
        });
        if (device_1) {
            decodedMessage.vdsmRequestGetProperty.query.forEach(function (p) {
                if (_this.debug)
                    console.log("Query", p);
                if (p.name == "outputSettings") {
                    // outputSettings
                    var elements_1 = [];
                    if (device_1.outputSetting) {
                        device_1.outputSetting.forEach(function (desc) {
                            var _a;
                            // loop all keys of an object
                            elements_1 = [];
                            var _loop_1 = function (key, value) {
                                if (key && messageMapping_1.outputSetting.find(function (o) { return o.name == key; })) {
                                    if (messageMapping_1.outputSetting && ((_a = messageMapping_1.outputSetting.find(function (o) { return o.name == key; })) === null || _a === void 0 ? void 0 : _a.type) ==
                                        "elements") {
                                        var subElements_1 = [];
                                        value.forEach(function (s) {
                                            subElements_1.push({
                                                name: s,
                                                value: {
                                                    vBool: "true"
                                                }
                                            });
                                        });
                                        elements_1.push({
                                            name: key,
                                            elements: subElements_1
                                        });
                                    }
                                    else {
                                        var valObj = {};
                                        var keyObj = messageMapping_1.outputSetting.find(function (o) { return o.name == key; });
                                        var objKey = keyObj === null || keyObj === void 0 ? void 0 : keyObj.type;
                                        valObj[objKey] = value;
                                        elements_1.push({
                                            name: key,
                                            value: valObj
                                        });
                                    }
                                    if (_this.debug) {
                                        console.log("ADDED ELEMENTS", JSON.stringify(elements_1));
                                    }
                                }
                            };
                            for (var _i = 0, _b = Object.entries(desc); _i < _b.length; _i++) {
                                var _c = _b[_i], key = _c[0], value = _c[1];
                                _loop_1(key, value);
                            }
                        });
                    }
                    if (elements_1.length > 0) {
                        properties.push({
                            name: "outputSettings",
                            elements: elements_1
                        });
                    }
                    else {
                        // commented, because p44 does not send it
                        /* properties.push({
                          name: p.name,
                          elements: [{ name: "" }],
                        }); */
                    }
                    if (_this.debug)
                        console.log(JSON.stringify(properties));
                }
                else if (p.name == "outputDescription") {
                    // outputDescription
                    var elements_2 = [];
                    if (device_1.outputDescription) {
                        device_1.outputDescription.forEach(function (desc) {
                            // loop all keys of an object
                            elements_2 = [];
                            var _loop_2 = function (key, value) {
                                if (key && messageMapping_1.outputDescription.find(function (o) { return o.name == key; })) {
                                    var valObj = {};
                                    var keyObj = messageMapping_1.outputSetting.find(function (o) { return o.name == key; });
                                    var objKey = keyObj === null || keyObj === void 0 ? void 0 : keyObj.type;
                                    valObj[objKey] = value;
                                    elements_2.push({
                                        name: key,
                                        value: valObj
                                    });
                                    if (_this.debug) {
                                        console.log("ADDED ELEMENTS", JSON.stringify(elements_2));
                                    }
                                }
                            };
                            for (var _i = 0, _a = Object.entries(desc); _i < _a.length; _i++) {
                                var _b = _a[_i], key = _b[0], value = _b[1];
                                _loop_2(key, value);
                            }
                        });
                    }
                    if (elements_2.length > 0) {
                        properties.push({
                            name: "outputDescription",
                            elements: elements_2
                        });
                    }
                    else {
                        // commented, because p44 does not send it
                        /* properties.push({
                          name: p.name,
                          elements: [{ name: "" }],
                        }); */
                    }
                }
                else if (p.name == "buttonInputSettings") {
                    // buttonInputSettings
                    if (Array.isArray(device_1.buttonInputSetting)) {
                        var biElements_1 = [];
                        device_1.buttonInputSetting.forEach(function (cdObj, i) {
                            if (cdObj &&
                                typeof cdObj === "object" &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                var subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                biElements_1.push({
                                    // name: `generic_${i}`,
                                    name: "button",
                                    elements: subElements
                                });
                            }
                            else {
                                properties.push({
                                    // name: `generic_${i}`,
                                    name: "button"
                                });
                            }
                        });
                        properties.push({
                            name: p.name,
                            elements: biElements_1
                        });
                    }
                    else {
                        properties.push({
                            name: p.name
                        });
                    }
                }
                else if (p.name == "buttonInputDescriptions") {
                    // buttonInputSettings
                    if (Array.isArray(device_1.buttonInputDescription)) {
                        var biElements_2 = [];
                        device_1.buttonInputDescription.forEach(function (cdObj, i) {
                            if (cdObj &&
                                typeof cdObj === "object" &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                var subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                biElements_2.push({
                                    // name: `generic_${i}`,
                                    name: "button",
                                    elements: subElements
                                });
                            }
                            else {
                                properties.push({
                                    // name: `generic_${i}`,
                                    name: "button"
                                });
                            }
                        });
                        properties.push({
                            name: p.name,
                            elements: biElements_2
                        });
                    }
                    else {
                        // commented, because p44 does not send it
                        /* properties.push({
                          name: p.name,
                          elements: [{ name: "" }],
                        }); */
                    }
                }
                else if (p.name == "sensorDescriptions") {
                    // sensorDescriptions
                    var elements_3 = [];
                    var sensorElements_1 = [];
                    if (device_1.sensorDescription) {
                        // console.log("SENSOR DESCRIPTIONS", device.sensorDescription);
                        device_1.sensorDescription.forEach(function (desc) {
                            // console.log("PROCESSING OBJECT", JSON.stringify(desc));
                            // loop all keys of an object
                            elements_3 = [];
                            var _loop_3 = function (key, value) {
                                if (key && messageMapping_1.sensorDescription.find(function (o) { return o.name == key; })) {
                                    var valObj = {};
                                    var keyObj = messageMapping_1.outputSetting.find(function (o) { return o.name == key; });
                                    var objKey = keyObj === null || keyObj === void 0 ? void 0 : keyObj.type;
                                    valObj[objKey] = value;
                                    elements_3.push({
                                        name: key,
                                        value: valObj
                                    });
                                    if (_this.debug) {
                                        console.log("ADDED ELEMENTS SENSOR", JSON.stringify(elements_3));
                                    }
                                }
                            };
                            for (var _i = 0, _a = Object.entries(desc); _i < _a.length; _i++) {
                                var _b = _a[_i], key = _b[0], value = _b[1];
                                _loop_3(key, value);
                            }
                            sensorElements_1.push({
                                name: desc.sensorName,
                                elements: elements_3
                            });
                        });
                    }
                    /* console.log(
                      "\n\n\n\nELEMENTS OF SENSORDESCRIPTIONS\n\n\n",
                      JSON.stringify(elements),
                      elements.length
                    ); */
                    if (elements_3.length > 0) {
                        properties.push({
                            name: "sensorDescriptions",
                            elements: sensorElements_1
                        });
                    }
                    else {
                        properties.push({
                            name: "sensorDescriptions"
                        });
                    }
                }
                else if (p.name == "zoneID") {
                    properties.push({
                        name: p.name,
                        value: {
                            vUint64: device_1.zoneID || 65534
                        }
                    });
                }
                else if (p.name == "binaryInputDescriptions") {
                    // binaryInputDescriptions
                    if (Array.isArray(device_1.binaryInputDescription)) {
                        var biElements_3 = [];
                        device_1.binaryInputDescription.forEach(function (cdObj, i) {
                            if (cdObj &&
                                typeof cdObj === "object" &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                var subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                biElements_3.push({
                                    // name: `generic_${i}`,
                                    // name: `generic`,
                                    name: cdObj.name,
                                    elements: subElements
                                });
                            }
                            else {
                                properties.push({
                                    // name: `generic_${i}`,
                                    name: "generic"
                                });
                            }
                        });
                        properties.push({
                            name: p.name,
                            elements: biElements_3
                        });
                    }
                    else {
                        properties.push({
                            name: p.name,
                            elements: [{ name: "" }]
                        });
                    }
                }
                else if (p.name == "binaryInputSettings") {
                    // binaryInputDescriptions
                    if (Array.isArray(device_1.binaryInputSetting)) {
                        var biElements_4 = [];
                        device_1.binaryInputSetting.forEach(function (cdObj, i) {
                            if (cdObj &&
                                typeof cdObj === "object" &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                var subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                biElements_4.push({
                                    // name: `generic_${i}`,
                                    // name: `generic`,
                                    name: cdObj.inputName,
                                    elements: subElements
                                });
                            }
                            else {
                                properties.push({
                                    // name: `generic_${i}`,
                                    name: "generic"
                                });
                            }
                        });
                        properties.push({
                            name: p.name,
                            elements: biElements_4
                        });
                    }
                    else {
                        properties.push({
                            name: p.name
                        });
                    }
                }
                else if (p.name == "sensorSettings") {
                    // binaryInputDescriptions
                    if (Array.isArray(device_1.sensorSetting)) {
                        var biElements_5 = [];
                        device_1.sensorSetting.forEach(function (cdObj, i) {
                            if (cdObj &&
                                typeof cdObj === "object" &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                var subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                biElements_5.push({
                                    // name: `generic_${i}`,
                                    // name: `generic`,
                                    name: cdObj.sensorName,
                                    elements: subElements
                                });
                            }
                            else {
                                properties.push({
                                    // name: `generic_${i}`,
                                    name: "generic"
                                });
                            }
                        });
                        properties.push({
                            name: p.name,
                            elements: biElements_5
                        });
                    }
                    else {
                        properties.push({
                            name: p.name
                        });
                    }
                }
                else if (p.name == "deviceActionDescriptions") {
                    // deviceActionDescriptions
                    properties.push({
                        name: p.name
                    });
                }
                else if (p.name == "customActions") {
                    // customActions
                    properties.push({
                        name: p.name
                    });
                }
                else if (p.name == "dynamicActionDescriptions") {
                    // dynamicActionDescriptions
                    properties.push({
                        name: p.name
                    });
                }
                else if (p.name == "deviceStates") {
                    // deviceStates
                    properties.push({
                        name: p.name
                    });
                }
                else if (p.name == "deviceProperties") {
                    // deviceStates
                    properties.push({
                        name: p.name
                    });
                }
                else if (p.name == "channelDescriptions") {
                    // channelDescriptions
                    if (Array.isArray(device_1.channelDescription)) {
                        device_1.channelDescription.forEach(function (cdObj) {
                            if (cdObj &&
                                typeof cdObj === "object" &&
                                !Array.isArray(cdObj) &&
                                cdObj !== null) {
                                var subElements = (0, messageMapping_1.createSubElements)(cdObj);
                                properties.push({
                                    name: p.name,
                                    elements: subElements
                                });
                            }
                            else {
                                properties.push({
                                    name: p.name
                                });
                            }
                        });
                    }
                    else {
                        properties.push({
                            name: p.name
                        });
                    }
                }
                else if (p.name == "deviceIcon16") {
                    // deviceIcon16
                    properties.push({
                        name: "deviceIcon16",
                        value: {
                            vBytes: "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"
                        }
                    });
                }
                else if (p.name == "binaryInputStates") {
                    // binaryInputStates
                    var message = {
                        dSUID: device_1.dSUID,
                        value: 0,
                        messageId: decodedMessage.messageId
                    };
                    _this.emitObject("binaryInputStateRequest", message);
                    sendIt = false;
                }
                else if (p.name == "sensorStates") {
                    // sensorStates
                    var message = {
                        dSUID: device_1.dSUID,
                        value: 0,
                        messageId: decodedMessage.messageId
                    };
                    _this.emitObject("sensorStatesRequest", message);
                    sendIt = false;
                }
                else if (p.name == "primaryGroup") {
                    // primaryGroup
                    properties.push({
                        name: "primaryGroup",
                        value: { vUint64: device_1.primaryGroup }
                    });
                }
                else if (p.name == "name") {
                    // primaryGroup
                    properties.push({
                        name: "name",
                        value: { vString: device_1.name }
                    });
                }
                else if (p.name == "vendorName") {
                    // vendorName
                    if (device_1.vendorName) {
                        properties.push({
                            name: "vendorName",
                            value: { vString: device_1.vendorName }
                        });
                    }
                }
                else if (p.name == "vendorId") {
                    // vendorId
                    if (device_1.vendorId) {
                        properties.push({
                            name: "vendorId",
                            value: { vString: device_1.vendorId }
                        });
                    }
                }
                else if (p.name == "configURL") {
                    // configURL
                    if (device_1.configURL) {
                        properties.push({
                            name: "configURL",
                            value: { vString: device_1.configURL }
                        });
                    }
                }
                else if (p.name == "modelFeatures") {
                    // modelFeatures
                    if (device_1.modelFeatures &&
                        typeof device_1.modelFeatures === "object" &&
                        !Array.isArray(device_1.modelFeatures) &&
                        device_1.modelFeatures !== null) {
                        var subElements = (0, messageMapping_1.createSubElements)(device_1.modelFeatures);
                        properties.push({
                            name: p.name,
                            elements: subElements
                        });
                    }
                    else {
                        properties.push({
                            name: p.name
                        });
                    }
                }
                else if (p.name == "displayId") {
                    properties.push({
                        name: "displayId",
                        value: { vString: device_1.displayId }
                    });
                }
                else if (p.name == "model") {
                    properties.push({
                        name: p.name,
                        value: { vString: device_1.model }
                    });
                }
                else if (p.name == "modelUID") {
                    properties.push({
                        name: p.name,
                        value: { vString: device_1.modelUID }
                    });
                }
                else if (p.name == "modelVersion") {
                    properties.push({
                        name: p.name,
                        value: { vString: device_1.modelVersion }
                    });
                }
                else if (p.name == "name") {
                    properties.push({
                        name: p.name,
                        value: { vString: device_1.name }
                    });
                }
                else if (p.name == "channelStates") {
                    // loop all indexes
                    var messageNames_1 = [];
                    p.elements.forEach(function (el) {
                        if (device_1.channelDescription[0][el.name]) {
                            // channel described -> emit query to get state
                            messageNames_1.push(el.name);
                        }
                    });
                    var message = {
                        dSUID: device_1.dSUID,
                        value: 0,
                        names: messageNames_1,
                        messageId: decodedMessage.messageId
                    };
                    _this.emitObject("channelStatesRequest", message);
                    sendIt = false;
                }
            });
        }
        else {
            // device not found
            if (this.debug) {
                console.error("Device ".concat(decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase(), " not found in devicelist"));
                if (this.debug)
                    console.log("Device ".concat(decodedMessage.vdsmRequestGetProperty.dSUID.toLowerCase(), " not found in devicelist"));
                // send not found to DS
                sendIt = false;
                var errorObj = {
                    code: "ERR_NOT_FOUND",
                    description: "unknown target (missing/invalid dSUID or itemSpec)"
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
            vdcResponseGetProperty: { properties: properties }
        }));
        var answerObj = this.vdsm.fromObject({
            type: 5,
            messageId: decodedMessage.messageId,
            vdcResponseGetProperty: { properties: properties }
        });
        var answerBuf = this.vdsm.encode(answerObj).finish();
        if (this.debug)
            console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
        conn.write(_addHeaders(answerBuf));
        /**
         * @event messageSent - New message sent to VDSM
         * @type {object}
         * @property Message Object
         */
        this.emitObject("messageSent", this.vdsm.decode(answerBuf));
    }
}
exports._vdcResponseGetProperty = _vdcResponseGetProperty;
/**
 * Push a new value to the VDSM
 * @param {Object} conn
 * @param {*} obj
 */
function _vdcSendPushProperty(conn, message) {
    if (message === void 0) { message = {
        obj: undefined,
        dSUID: ""
    }; }
    this.messageId = this.messageId + 1;
    var answerObj = this.vdsm.fromObject({
        type: 12,
        messageId: this.messageId,
        vdcSendPushProperty: { dSUID: message.dSUID, properties: message.obj }
    });
    var answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property Message Object
     */
    this.emit("messageSent", this.vdsm.decode(answerBuf));
}
exports._vdcSendPushProperty = _vdcSendPushProperty;
/**
 * Push a new channelState
 *
 * @param {*} conn
 * @param {*} message
 */
function _vdcPushChannelStates(conn, message) {
    conn.write(_addHeaders(message));
    this.emit("messageSent", this.vdsm.decode(message));
}
exports._vdcPushChannelStates = _vdcPushChannelStates;
/**
 * Sends a vdsmResponseHello message
 * @param  {} conn
 * @param  {} decodedMessage
 */
function _vdsmResponseHello(conn, decodedMessage) {
    var answerObj = this.vdsm.fromObject({
        type: 3,
        messageId: decodedMessage.messageId,
        vdcResponseHello: { dSUID: this.config.vdcDSUID }
    });
    var answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property Message Object
     */
    this.emitObject("messageSent", this.vdsm.decode(answerBuf));
}
exports._vdsmResponseHello = _vdsmResponseHello;
/**
 * Sends a vdcSendAnnounceVdc message
 * @param  {} conn
 */
function _vdcSendAnnounceVdc(conn) {
    this.messageId = this.messageId + 1;
    var answerObj = this.vdsm.fromObject({
        type: 23,
        messageId: this.messageId,
        vdcSendAnnounceVdc: { dSUID: this.config.vdcDSUID }
    });
    var answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property Message Object
     */
    this.emitObject("messageSent", this.vdsm.decode(answerBuf));
}
exports._vdcSendAnnounceVdc = _vdcSendAnnounceVdc;
/**
 * Sends a vdcSendPong message
 * @param  {} conn
 * @param  {} decodedMessage
 */
function _vdcSendPong(conn, decodedMessage) {
    var answerObj = this.vdsm.fromObject({
        type: 9,
        messageId: decodedMessage.messageId + 1,
        vdcSendPong: { dSUID: decodedMessage.vdsmSendPing.dSUID }
    });
    var answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property Message Object
     */
    this.emitObject("messageSent", this.vdsm.decode(answerBuf));
}
exports._vdcSendPong = _vdcSendPong;
/**
 * Sends a generic response
 * @param  {Object} conn
 * @param  {Object} GenericResponse
 */
function _genericResponse(conn, GenericResponse, messageId) {
    // this.messageId = this.messageId + 1;
    if (this.debug)
        console.log(GenericResponse);
    var answerObj = this.vdsm.fromObject({
        type: 1,
        messageId: messageId,
        genericResponse: { GenericResponse: GenericResponse }
    });
    var answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property Message Object
     */
    this.emit("messageSent", this.vdsm.decode(answerBuf));
}
exports._genericResponse = _genericResponse;
/**
 * Announces a new device which is then queried by the VDSM
 * @param {Object} conn
 * @param {String} dSUID - dSUID of the device which needs to be announced
 */
function _vdcSendAnnounceDevice(conn, dSUID) {
    this.messageId = this.messageId + 1;
    var answerObj = this.vdsm.fromObject({
        type: 10,
        messageId: this.messageId,
        vdcSendAnnounceDevice: {
            dSUID: dSUID,
            vdcDSUID: this.config.vdcDSUID
        }
    });
    var answerBuf = this.vdsm.encode(answerObj).finish();
    if (this.debug)
        console.log(JSON.stringify(this.vdsm.decode(answerBuf)));
    conn.write(_addHeaders(answerBuf));
    /**
     * @event messageSent - New message sent to VDSM
     * @type {object}
     * @property Message Object
     */
    this.emitObject("messageSent", this.vdsm.decode(answerBuf));
}
exports._vdcSendAnnounceDevice = _vdcSendAnnounceDevice;
/**
 * Digitalstrom requires a 2 byte header with the lenght. This functions adds that header to the buffer
 * @param  {} buffer
 */
function _addHeaders(buffer) {
    function decimalToHex(d, padding) {
        var hex = Number(d).toString(16);
        padding =
            typeof padding === "undefined" || padding === null
                ? (padding = 2)
                : padding;
        while (hex.length < padding) {
            hex = "0" + hex;
        }
        return hex;
    }
    var h = decimalToHex(buffer.length, 4);
    var cA = [Buffer.from(h, "hex"), buffer];
    return Buffer.concat(cA);
}
