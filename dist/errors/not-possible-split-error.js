"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NotPossibleSplitError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
exports.NotPossibleSplitError = NotPossibleSplitError;
