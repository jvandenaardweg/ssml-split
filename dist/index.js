"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const polly_text_split_1 = __importDefault(require("polly-text-split"));
const defaults_1 = __importDefault(require("./defaults"));
const errors_1 = require("./errors");
/**
 * Creates a tree data structure from SSML text.
 * @class
 */
class SSMLSplit {
    constructor(options) {
        if (options && typeof options !== 'object') {
            throw new errors_1.ConfigurationValidationError('Parameter `options` must be an object.');
        }
        this.setDefaults();
        this.options = {
            softLimit: options && options.softLimit || defaults_1.default.SOFT_LIMIT,
            hardLimit: options && options.hardLimit || defaults_1.default.HARD_LIMIT,
            includeSSMLTagsInCounter: options && options.includeSSMLTagsInCounter || defaults_1.default.INCLUDE_SSML_TAGS_IN_COUNTER,
            extraSplitChars: options && options.extraSplitChars || defaults_1.default.EXTRA_SPLIT_CHARS,
            breakParagraphsAboveHardLimit: options && options.breakParagraphsAboveHardLimit || defaults_1.default.BREAK_PARAGRAPHS_ABOVE_HARD_LIMIT
        };
    }
    /**
     * Split SSML text by batches of ~3000 (by default) chars.
     *
     * @throws {NotPossibleSplitError} Text cannot be split, increase `hardLimit`.
     * @throws {SSMLParseError} Argument `ssml` is not a valid SSML string.
     */
    split(ssmlInput) {
        // Set the defaults everytime we invoke split
        // So you can use the split method multiple times using the same class instance
        this.setDefaults();
        // Create a copy so ssmlInput stays intact when we replace paragraphs with breaks
        let ssmlToWorkWith = `${ssmlInput}`;
        if (this.options.breakParagraphsAboveHardLimit && ssmlToWorkWith.length > this.options.hardLimit) {
            // Remove paragraphs and replace it with a break.
            // This allows easier break up of long paragraphs, while maintaining the proper pause at the end.
            // Adding <break strength="x-strong" /> at the end of a paragraph is the same as wrapping your text inside a <p></p>
            // https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#p-tag
            ssmlToWorkWith = ssmlToWorkWith.replace(/<p>/g, '');
            ssmlToWorkWith = ssmlToWorkWith.replace(/<\/p>/g, '<break strength="x-strong" />');
        }
        // Sanitize and create tree
        this.buildTree(this.sanitize(ssmlToWorkWith));
        // Check if SSML is wrapped with <speak> tag
        if (this.root.children.length === 1 && this.root.children[0].type === 'speak') {
            // Remove global <speak> tag node
            // since the text will be split, new <speak> tags will wrap batches
            this.root.children = this.root.children[0].children;
        }
        if (this.root.children.length === 0) {
            return this.batches;
        }
        // Start traversing root children
        this.root.children.forEach((node) => {
            // root level - can make splits here
            if (this.characterCounter < this.options.softLimit) {
                // Text node on the top level can be too long and become > SOFT_LIMIT and even HARD_LIMIT
                // So we need to explicitly check for overflow here
                if (node.type === 'TEXT' &&
                    this.textLength + node.value.length > this.options.softLimit) {
                    this.splitTextNode(node);
                }
                else {
                    // Text node is short or this is a tag node, that needs to be traversed, can't split here
                    this.traverseNode(node);
                }
            }
            else if (this.characterCounter < this.options.hardLimit) {
                // SOFT_LIMIT is reached -> search for possible split locations
                this.makeSpeakBatch(this.accumulatedSSML);
                this.accumulatedSSML = '';
                this.textLength = 0;
                if (node.type === 'TEXT' && node.value.length > this.options.softLimit) {
                    this.splitTextNode(node);
                }
                else {
                    // Text node is short or this is a tag node, that needs to be traversed, can't split here
                    this.traverseNode(node);
                }
            }
            else {
                throw new errors_1.NotPossibleSplitError('SSML tag appeared to be too long.');
            }
        });
        if (this.characterCounter !== 0) {
            if (this.characterCounter < this.options.hardLimit) {
                this.makeSpeakBatch(this.accumulatedSSML);
            }
            else {
                throw new errors_1.NotPossibleSplitError('Last SSML tag appeared to be too long.');
            }
        }
        return this.batches.splice(0);
    }
    get characterCounter() {
        return this.options.includeSSMLTagsInCounter ? this.accumulatedSSML.length : this.textLength;
    }
    setDefaults() {
        this.root = {
            parentNode: null,
            type: 'root',
            children: [],
            value: ''
        };
        this.batches = [];
        this.accumulatedSSML = '';
        this.textLength = 0;
    }
    sanitize(ssml) {
        return ssml.split('\n').join(' ');
    }
    traverseNode(currentNode) {
        // check if node has children to check out too
        if (currentNode.children) {
            if (currentNode.type !== 'root') {
                // open tag
                this.accumulatedSSML += `<${currentNode.type}${currentNode.value}>`;
            }
            currentNode.children.forEach((node) => {
                this.traverseNode(node);
            });
            // close tag
            this.accumulatedSSML += `</${currentNode.type}>`;
        }
        else {
            // no children
            this.accumulatedSSML += this.noChildrenNodeToText(currentNode);
        }
    }
    splitTextNode(node) {
        // Overflows => Text node needs to be checked for possible split location
        const localSoftLimit = this.textLength === 0 ? this.options.softLimit : this.options.softLimit - this.textLength;
        const localHardLimit = localSoftLimit + this.options.hardLimit - this.options.softLimit;
        polly_text_split_1.default.configure({
            hardLimit: localHardLimit,
            softLimit: localSoftLimit,
            extraSplitChars: this.options.extraSplitChars ? this.options.extraSplitChars : undefined,
        });
        const splitIndex = polly_text_split_1.default.splitIndex(node.value);
        this.makeSpeakBatch(this.accumulatedSSML + node.value.slice(0, splitIndex + 1));
        this.accumulatedSSML = node.value.slice(splitIndex + 1);
        this.textLength = this.accumulatedSSML.length;
        // If the remaining TEXT value is too long again, split it
        if (this.textLength > this.options.softLimit) {
            polly_text_split_1.default.configure({
                hardLimit: this.options.hardLimit,
                softLimit: this.options.softLimit,
                extraSplitChars: this.options.extraSplitChars ? this.options.extraSplitChars : undefined,
            });
            // Get text batches
            polly_text_split_1.default.split(this.accumulatedSSML).forEach((text) => {
                this.makeSpeakBatch(text);
            });
            this.accumulatedSSML = '';
            this.textLength = 0;
        }
    }
    noChildrenNodeToText(node) {
        if (node.type === 'TEXT') {
            this.textLength += node.value.length;
            return node.value;
        }
        else {
            // SSML empty tag (i.e. no children)
            return `<${node.type}${node.value}/>`;
        }
    }
    /**
     * Pushes a SSML string into the batch array
     */
    makeSpeakBatch(ssml) {
        this.batches.push(`<speak>${ssml}</speak>`);
    }
    /**
     * Adds a new tree node as a parentNode child.
     */
    addNode(parentNode, newNode) {
        if (parentNode.children) {
            parentNode.children.push(newNode);
        }
        else {
            parentNode.children = [newNode];
        }
    }
    /**
     * Creates tree data structure from SSML text.
     */
    buildTree(ssml) {
        // remove extra space if needed
        ssml = ssml.trim();
        let text = '';
        let textHasStarted = false;
        let currentNode = this.root;
        for (let i = 0, len = ssml.length; i < len; i++) {
            // check if the char is a plain text or SSML tag
            if (ssml[i] === '<') {
                /*
                 * 1. SSML tag
                 */
                // check if the text was already started - finish it and add to the parentNode
                if (textHasStarted) {
                    textHasStarted = false;
                    const newNode = {
                        parentNode: currentNode,
                        type: 'TEXT',
                        value: text,
                    };
                    this.addNode(currentNode, newNode);
                }
                // type and value/attributes of parsed SSML tag
                let type = '';
                let value = ''; // can be blank, like <tag /> or <tag></tag>
                let isEndTag = false; // flag for end tag (</tag>)
                let isEmptyTag = false; // flag for empty tag (<tag />)
                // start from next char
                let j = i + 1;
                // check if it is an end tag (no value)
                if (ssml[j] === '/') {
                    isEndTag = true;
                    // start from the next char
                    j++;
                    // parse only type
                    while (ssml[j] !== '>') {
                        type += ssml[j];
                        j++;
                    }
                }
                else {
                    /*
                     *  1. Parse type unless:
                     *  ' ' - value is coming
                     *  '>' - is start tag marker
                     *  '/' - is empty tag marker
                     */
                    while (ssml[j] !== ' ' && ssml[j] !== '>' && ssml[j] !== '/') {
                        type += ssml[j];
                        j++;
                    }
                    // 2. Parse value
                    while (true) {
                        if (ssml[j] !== '>') {
                            // A. value continues -> accumulate value
                            value += ssml[j];
                        }
                        else if (ssml[j - 1] === '/') {
                            // B. empty tag <tag />
                            isEmptyTag = true;
                            // remove last `/` char from value
                            if (value.length !== 0) {
                                value = value.slice(0, value.length - 1);
                            }
                            break;
                        }
                        else {
                            // C. end tag </tag>
                            break;
                        }
                        j++;
                    }
                }
                /*
                 * Process parsed results
                 */
                if (!isEndTag) {
                    const newNode = {
                        parentNode: currentNode,
                        type,
                        value
                    };
                    this.addNode(currentNode, newNode);
                    if (!isEmptyTag) {
                        // Not an empty tag => can have other children, then keep it active
                        currentNode = newNode;
                    }
                }
                else if (isEmptyTag) {
                    // TODO: this else if might not be needed, might be removed
                    // an empty tag (<break />) cannot be an end tag (</break />), doesnt make sense
                    // is an end tag + empty end tag
                    const newNode = {
                        parentNode: currentNode,
                        type,
                        value,
                    };
                    this.addNode(currentNode, newNode);
                }
                else {
                    // is an end tag </tag>
                    // close current tag = no more children
                    // sanity check
                    if (currentNode.type !== type) {
                        const msg = `Incorrect SSML: ${type} !== ${currentNode.type}`;
                        throw new errors_1.SSMLParseError(msg);
                    }
                    currentNode = currentNode.parentNode;
                }
                // skip processed chars for the next iteration
                i = j;
            }
            else {
                /*
                 * 2. Plain text
                 */
                if (!textHasStarted) {
                    textHasStarted = true;
                    text = '';
                }
                // accumulate characters
                text += ssml[i];
                if (i === len - 1 && textHasStarted) {
                    // ssml ends with plain text => create node
                    const newNode = {
                        parentNode: currentNode,
                        type: 'TEXT',
                        value: text,
                    };
                    this.addNode(currentNode, newNode);
                }
            }
        }
    }
}
exports.SSMLSplit = SSMLSplit;
exports.default = SSMLSplit;
