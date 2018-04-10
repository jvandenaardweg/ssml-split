const { SSMLParseError } = require('./errors')
const { HARD_LIMIT, SOFT_LIMIT, EXTRA_SPLIT_CHARS } = require('./defaults')

/**
 * @typedef {Object} Node Tree node that can contain plain text or SSML tag.
 * @property {string} type Type of node: `TEXT` or SSML tag like `prosody`, `speak`.
 * @property {string} value Text value for `TEXT` node or attributes for SSML tag.
 * @property {Node} parentNode Pointer to a parent node.
 * @property {Array<Node>} children Text value for `TEXT` node or attributes for SSML tag.
 */

/**
 * Creates a tree data structure from SSML text.
 * @class
 */
class SSMLSplit {
    /**
     * Set default character limits.
     * Initialize tree.
     *
     * @param {number} hardLimit
     * @param {number} softLimit
     */
    constructor(hardLimit, softLimit) {
        /** @private */
        this._root = {
            parentNode: null,
            type: 'root',
            children: [],
        }
        /** @private */
        this._batches = []
        /** @private */
        this._hardLimit = hardLimit
        /** @private */
        this._softLimit = softLimit
    }

    /**
     * Split SSML text by batches of ~1500 chars.
     *
     * @param {string} ssml String containing text with SSML tags.
     * @returns {Array<string>} Array of valid SSML strings.
     */
    split(ssml) {
        // Create tree
        this._buildTree(ssml)

        // check if SSML is wrapped with <speak> tag
        if (this._root.children.length === 1 && this._root.children[0].type === 'speak') {
            // remove global <speak> tag node
            // since the text will be split, new <speak> tags will wrap batches
            this._root.children = this._root.children[0].children
        }

        this._accumulatedSSML = ''
        this._textLength = 0

        if (this._root.children.length === 0) return this._batches

        // start traversing root children
        this._root.children.forEach(node => {
            if (this._accumulatedSSML.length < this._softLimit) {
                // Text node on the top level can be too long and become > SOFT_LIMIT and even HARD_LIMIT
                // So we need to explicitly check for overflow here
                if (
                    node.type === 'TEXT' &&
                    node.value.length + this._accumulatedSSML.length > this._softLimit
                ) {
                    // Overflows => Text node needs to be checked for possible split location
                    
                } else {
                    // tag needs to be completely parsed, can't split here
                    // skip checking for split locations until SOFT_LIMIT is not reached
                    this._traverseNode(node)
                }
            } else {
                // SOFT_LIMIT is reached -> search for possible split locations
                // console.log('---', 'limit reached')
                // console.log('---', this._accumulatedSSML)
            }

            // root level - can make splits here

            console.log('--- ssml:', this._accumulatedSSML.length)
            console.log('--- text:', this._textLength)
        })

        console.log('---', this._accumulatedSSML)

        // while (true) {
        // if (currentNode.parentNode === this._root) {
        //     // top level - can split
        // }
        // }
    }

    /**
     *
     * @param {Node} currentNode
     */
    _traverseNode(currentNode) {
        // check if node has children to check out too
        if (currentNode.children) {
            if (currentNode.type !== 'root') {
                // open tag
                this._accumulatedSSML += `<${currentNode.type}${currentNode.value}>`
            }

            currentNode.children.forEach(node => {
                this._traverseNode(node)
            })
            // close tag
            this._accumulatedSSML += `</${currentNode.type}>`
        } else {
            // no children
            this._accumulatedSSML += this._noChildrenNodeToText(currentNode)
        }
    }

    /**
     *
     * @param {Node} node
     */
    _noChildrenNodeToText(node) {
        if (node.type === 'TEXT') {
            this._textLength += node.value.length
            return node.value
        } else {
            // SSML empty tag (i.e. no children)
            return `<${node.type}${node.value}/>`
        }
    }

    /**
     *
     * @param {string} ssml
     */
    _makeSpeakBatch(ssml) {
        this._batches.push(`<speak>${ssml}</speak>`)
    }

    /**
     * Adds a new tree node as a parentNode child.
     *
     * @param {Node} parentNode
     * @param {Node} newNode
     * @private
     */
    _addNode(parentNode, newNode) {
        if (parentNode.children) {
            parentNode.children.push(newNode)
        } else {
            parentNode.children = [newNode]
        }
    }

    /**
     * Creates tree data structure from SSML text.
     * @param {string} ssml String containing text with SSML tags.
     * @private
     */
    _buildTree(ssml) {
        // remove extra space if needed
        ssml = ssml.trim(ssml)

        let text = ''
        let textHasStarted = false
        let currentNode = this._root

        for (let i = 0, len = ssml.length; i < len; i++) {
            // check if the char is a plain text or SSML tag
            if (ssml[i] === '<') {
                /*
                 * 1. SSML tag
                 */

                // check if the text was already started - finish it and add to the parentNode
                if (textHasStarted) {
                    textHasStarted = false

                    const newNode = {
                        parentNode: currentNode,
                        type: 'TEXT',
                        value: text,
                    }

                    this._addNode(currentNode, newNode)
                }

                // type and value/attributes of parsed SSML tag
                let type = ''
                let value = '' // can be blank, like <tag /> or <tag></tag>

                let isEndTag = false // flag for end tag (</tag>)
                let isEmptyTag = false // flag for empty tag (<tag />)

                // start from next char
                let j = i + 1

                // check if it is an end tag (no value)
                if (ssml[j] === '/') {
                    isEndTag = true

                    // start from the next char
                    j++

                    // parse only type
                    while (ssml[j] !== '>') {
                        type += ssml[j]
                        j++
                    }
                } else {
                    /*
                     *  1. Parse type unless:
                     *  ' ' - value is coming
                     *  '>' - is start tag marker
                     *  '/' - is empty tag marker
                     */
                    while (ssml[j] !== ' ' && ssml[j] !== '>' && ssml[j] !== '/') {
                        type += ssml[j]
                        j++
                    }

                    // 2. Parse value
                    while (true) {
                        if (ssml[j] !== '>') {
                            // A. value continues -> accumulate value
                            value += ssml[j]
                        } else if (ssml[j - 1] === '/') {
                            // B. empty tag <tag />
                            isEmptyTag = true

                            // remove last `/` char from value
                            if (value.length !== 0) value = value.slice(0, value.length - 1)
                            break
                        } else {
                            // C. end tag </tag>
                            break
                        }
                        j++
                    }
                }

                /*
                 * Process parsing results
                 */

                if (!isEndTag) {
                    const newNode = {
                        parentNode: currentNode,
                        type,
                        value,
                    }
                    this._addNode(currentNode, newNode)

                    if (!isEmptyTag) {
                        // Not an empty tag => can have other children, then keep it active
                        currentNode = newNode
                    }
                } else if (isEmptyTag) {
                    // is an end tag + empty end tag
                    const newNode = {
                        parentNode: currentNode,
                        type,
                        value,
                    }
                    this._addNode(currentNode, newNode)
                } else {
                    // is an end tag </tag>
                    // close current tag = no more children

                    // sanity check
                    if (currentNode.type !== type) {
                        const msg = `Incorrect SSML: ${type} !== ${currentNode.type}`
                        throw new SSMLParseError(msg)
                    }
                    currentNode = currentNode.parentNode
                }

                // skip processed chars for the next iteration
                i = j
            } else {
                /*
                 * 2. Plain text
                 */
                if (!textHasStarted) {
                    textHasStarted = true
                    text = ''
                }

                // accumulate characters
                text += ssml[i]
            }
        }
    }
}

module.exports = new SSMLSplit(HARD_LIMIT, SOFT_LIMIT)

/*-----------------------------------------------------------------------------
 *  Tests
 *----------------------------------------------------------------------------*/

const text = `<speak>hi <p>hello</p> hi</speak> `
new SSMLSplit(1000, 500).split(text)
