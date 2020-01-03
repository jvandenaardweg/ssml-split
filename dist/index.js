"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const polly_text_split_1 = __importDefault(require("polly-text-split"));
const defaults_1 = require("./defaults");
const errors_1 = require("./errors");
const _root = Symbol();
const _batches = Symbol();
const _softLimit = Symbol();
const _hardLimit = Symbol();
const _extraSplitChars = Symbol();
const _accumulatedSSML = Symbol();
const _textLength = Symbol();
const _includeSSMLTagsInCounter = Symbol();
const _characterCounter = Symbol();
const _splitTextNode = Symbol();
const _noChildrenNodeToText = Symbol();
const _sanitize = Symbol();
const _traverseNode = Symbol();
const _makeSpeakBatch = Symbol();
const _addNode = Symbol();
const _buildTree = Symbol();
class SSMLSplit {
    constructor(softLimit, hardLimit) {
        this[_root] = {
            parentNode: null,
            type: "root",
            children: [],
        };
        this[_batches] = [];
        this[_softLimit] = softLimit;
        this[_hardLimit] = hardLimit;
    }
    configure(options) {
        if (!options) {
            throw new errors_1.ConfigurationValidationError("Parameter `options` is missing.");
        }
        if (typeof options !== "object") {
            throw new errors_1.ConfigurationValidationError("Parameter `options` must be an object.");
        }
        this[_softLimit] = options.softLimit;
        this[_hardLimit] = options.hardLimit;
        this[_includeSSMLTagsInCounter] = options.includeSSMLTagsInCounter || false;
        if (options.extraSplitChars && typeof options.extraSplitChars === "string") {
            this[_extraSplitChars] = options.extraSplitChars;
        }
    }
    split(ssml) {
        if (this[_root].children.length !== 0) {
            this[_root].children = [];
        }
        this[_buildTree](this[_sanitize](ssml));
        if (this[_root].children.length === 1 && this[_root].children[0].type === "speak") {
            this[_root].children = this[_root].children[0].children;
        }
        this[_accumulatedSSML] = "";
        this[_textLength] = 0;
        if (this[_root].children.length === 0) {
            return this[_batches];
        }
        this[_root].children.forEach((node) => {
            this[_characterCounter] = this[_includeSSMLTagsInCounter] ? this[_accumulatedSSML].length : this[_textLength];
            if (this[_characterCounter] < this[_softLimit]) {
                if (node.type === "TEXT" &&
                    this[_textLength] + node.value.length > this[_softLimit]) {
                    this[_splitTextNode](node);
                }
                else {
                    this[_traverseNode](node);
                }
            }
            else if (this[_characterCounter] < this[_hardLimit]) {
                this[_makeSpeakBatch](this[_accumulatedSSML]);
                this[_accumulatedSSML] = "";
                this[_textLength] = 0;
                if (node.type === "TEXT" && node.value.length > this[_softLimit]) {
                    this[_splitTextNode](node);
                }
                else {
                    this[_traverseNode](node);
                }
            }
            else {
                throw new errors_1.NotPossibleSplitError("SSML tag appeared to be too long.");
            }
        });
        this[_characterCounter] = this[_includeSSMLTagsInCounter] ? this[_accumulatedSSML].length : this[_textLength];
        if (this[_characterCounter] !== 0) {
            if (this[_characterCounter] < this[_hardLimit]) {
                this[_makeSpeakBatch](this[_accumulatedSSML]);
            }
            else {
                throw new errors_1.NotPossibleSplitError("Last SSML tag appeared to be too long.");
            }
        }
        return this[_batches].splice(0);
    }
    [_sanitize](ssml) {
        return ssml.split("\n").join(" ");
    }
    [_traverseNode](currentNode) {
        if (currentNode.children) {
            if (currentNode.type !== "root") {
                this[_accumulatedSSML] += `<${currentNode.type}${currentNode.value}>`;
            }
            currentNode.children.forEach((node) => {
                this[_traverseNode](node);
            });
            this[_accumulatedSSML] += `</${currentNode.type}>`;
        }
        else {
            this[_accumulatedSSML] += this[_noChildrenNodeToText](currentNode);
        }
    }
    [_splitTextNode](node) {
        const localSoftLimit = this[_textLength] === 0 ? this[_softLimit] : this[_softLimit] - this[_textLength];
        const localHardLimit = localSoftLimit + this[_hardLimit] - this[_softLimit];
        polly_text_split_1.default.configure({
            hardLimit: localHardLimit,
            softLimit: localSoftLimit,
            extraSplitChars: this[_extraSplitChars] ? this[_extraSplitChars] : undefined,
        });
        const splitIndex = polly_text_split_1.default.splitIndex(node.value);
        this[_makeSpeakBatch](this[_accumulatedSSML] + node.value.slice(0, splitIndex + 1));
        this[_accumulatedSSML] = node.value.slice(splitIndex + 1);
        this[_textLength] = this[_accumulatedSSML].length;
        if (this[_textLength] > this[_softLimit]) {
            polly_text_split_1.default.configure({
                hardLimit: this[_hardLimit],
                softLimit: this[_softLimit],
                extraSplitChars: this[_extraSplitChars] ? this[_extraSplitChars] : undefined,
            });
            polly_text_split_1.default.split(this[_accumulatedSSML]).forEach((text) => {
                this[_makeSpeakBatch](text);
            });
            this[_accumulatedSSML] = "";
            this[_textLength] = 0;
        }
    }
    [_noChildrenNodeToText](node) {
        if (node.type === "TEXT") {
            this[_textLength] += node.value.length;
            return node.value;
        }
        else {
            return `<${node.type}${node.value}/>`;
        }
    }
    [_makeSpeakBatch](ssml) {
        this[_batches].push(`<speak>${ssml}</speak>`);
    }
    [_addNode](parentNode, newNode) {
        if (parentNode.children) {
            parentNode.children.push(newNode);
        }
        else {
            parentNode.children = [newNode];
        }
    }
    [_buildTree](ssml) {
        ssml = ssml.trim(ssml);
        let text = "";
        let textHasStarted = false;
        let currentNode = this[_root];
        for (let i = 0, len = ssml.length; i < len; i++) {
            if (ssml[i] === "<") {
                if (textHasStarted) {
                    textHasStarted = false;
                    const newNode = {
                        parentNode: currentNode,
                        type: "TEXT",
                        value: text,
                    };
                    this[_addNode](currentNode, newNode);
                }
                let type = "";
                let value = "";
                let isEndTag = false;
                let isEmptyTag = false;
                let j = i + 1;
                if (ssml[j] === "/") {
                    isEndTag = true;
                    j++;
                    while (ssml[j] !== ">") {
                        type += ssml[j];
                        j++;
                    }
                }
                else {
                    while (ssml[j] !== " " && ssml[j] !== ">" && ssml[j] !== "/") {
                        type += ssml[j];
                        j++;
                    }
                    while (true) {
                        if (ssml[j] !== ">") {
                            value += ssml[j];
                        }
                        else if (ssml[j - 1] === "/") {
                            isEmptyTag = true;
                            if (value.length !== 0) {
                                value = value.slice(0, value.length - 1);
                            }
                            break;
                        }
                        else {
                            break;
                        }
                        j++;
                    }
                }
                if (!isEndTag) {
                    const newNode = {
                        parentNode: currentNode,
                        type,
                        value,
                    };
                    this[_addNode](currentNode, newNode);
                    if (!isEmptyTag) {
                        currentNode = newNode;
                    }
                }
                else if (isEmptyTag) {
                    const newNode = {
                        parentNode: currentNode,
                        type,
                        value,
                    };
                    this[_addNode](currentNode, newNode);
                }
                else {
                    if (currentNode.type !== type) {
                        const msg = `Incorrect SSML: ${type} !== ${currentNode.type}`;
                        throw new errors_1.SSMLParseError(msg);
                    }
                    currentNode = currentNode.parentNode;
                }
                i = j;
            }
            else {
                if (!textHasStarted) {
                    textHasStarted = true;
                    text = "";
                }
                text += ssml[i];
                if (i === len - 1 && textHasStarted) {
                    const newNode = {
                        parentNode: currentNode,
                        type: "TEXT",
                        value: text,
                    };
                    this[_addNode](currentNode, newNode);
                }
            }
        }
    }
}
exports.default = new SSMLSplit(defaults_1.SOFT_LIMIT, defaults_1.HARD_LIMIT);
