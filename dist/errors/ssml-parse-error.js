"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SSMLParseError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
exports.SSMLParseError = SSMLParseError;
