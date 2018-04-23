class ConfigurationValidationError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message)
        this.name = this.constructor.name
    }
}

class SSMLParseError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message)
        this.name = this.constructor.name
    }
}

class NotPossibleSplitError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message)
        this.name = this.constructor.name
    }
}

module.exports = { ConfigurationValidationError, SSMLParseError, NotPossibleSplitError }
