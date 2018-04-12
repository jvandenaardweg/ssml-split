class ValidationError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message)
        this.name = 'ValidationError'
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

module.exports = { ValidationError, SSMLParseError, NotPossibleSplitError }
