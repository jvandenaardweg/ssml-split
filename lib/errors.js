class ValidationError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message)
        this.name = 'Validation Error'
    }
}

class SSMLParseError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message)
        this.name = 'SSML Parse Error'
    }
}

module.exports = { ValidationError, SSMLParseError }
