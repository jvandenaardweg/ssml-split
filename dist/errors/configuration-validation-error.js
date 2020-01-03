"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConfigurationValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
exports.ConfigurationValidationError = ConfigurationValidationError;
