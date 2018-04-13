class ConfigurationValidationError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message)
        this.name = 'ConfigurationValidationError'
    }
}

class SSMLParseError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message)
        this.name = 'SSMLParseError'
    }
}

class NotPossibleSplitError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message)
        this.name = 'NotPossibleSplitError'
    }
}

module.exports = { ConfigurationValidationError, SSMLParseError, NotPossibleSplitError }
