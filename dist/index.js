"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const polly_text_split_1 = __importDefault(require("polly-text-split"));
const defaults_1 = __importDefault(require("./defaults"));
const errors_1 = require("./errors");
class SSMLSplit {
    constructor(options) {
        if (options && typeof options !== "object") {
            throw new errors_1.ConfigurationValidationError("Parameter `options` must be an object.");
        }
        this.root = {
            parentNode: null,
            type: "root",
            children: [],
        };
        this.batches = [];
        this.accumulatedSSML = '';
        this.textLength = 0;
        this.characterCounter = 0;
        this.options = {
            softLimit: options && options.softLimit || defaults_1.default.SOFT_LIMIT,
            hardLimit: options && options.hardLimit || defaults_1.default.HARD_LIMIT,
            includeSSMLTagsInCounter: options && options.includeSSMLTagsInCounter || defaults_1.default.INCLUDE_SSML_TAGS_IN_COUNTER,
            extraSplitChars: options && options.extraSplitChars || defaults_1.default.EXTRA_SPLIT_CHARS
        };
    }
    split(ssml) {
        if (this.root.children.length !== 0) {
            this.root.children = [];
        }
        this.buildTree(this.sanitize(ssml));
        if (this.root.children.length === 1 && this.root.children[0].type === "speak") {
            this.root.children = this.root.children[0].children;
        }
        this.accumulatedSSML = "";
        this.textLength = 0;
        if (this.root.children.length === 0) {
            return this.batches;
        }
        this.root.children.forEach((node) => {
            this.characterCounter = this.options.includeSSMLTagsInCounter ? this.accumulatedSSML.length : this.textLength;
            if (this.characterCounter < this.options.softLimit) {
                if (node.type === "TEXT" &&
                    this.textLength + node.value.length > this.options.softLimit) {
                    this.splitTextNode(node);
                }
                else {
                    this.traverseNode(node);
                }
            }
            else if (this.characterCounter < this.options.hardLimit) {
                this.makeSpeakBatch(this.accumulatedSSML);
                this.accumulatedSSML = "";
                this.textLength = 0;
                if (node.type === "TEXT" && node.value.length > this.options.softLimit) {
                    this.splitTextNode(node);
                }
                else {
                    this.traverseNode(node);
                }
            }
            else {
                throw new errors_1.NotPossibleSplitError("SSML tag appeared to be too long.");
            }
        });
        this.characterCounter = this.options.includeSSMLTagsInCounter ? this.accumulatedSSML.length : this.textLength;
        if (this.characterCounter !== 0) {
            if (this.characterCounter < this.options.hardLimit) {
                this.makeSpeakBatch(this.accumulatedSSML);
            }
            else {
                throw new errors_1.NotPossibleSplitError("Last SSML tag appeared to be too long.");
            }
        }
        return this.batches.splice(0);
    }
    sanitize(ssml) {
        return ssml.split("\n").join(" ");
    }
    traverseNode(currentNode) {
        if (currentNode.children) {
            if (currentNode.type !== "root") {
                this.accumulatedSSML += `<${currentNode.type}${currentNode.value}>`;
            }
            currentNode.children.forEach((node) => {
                this.traverseNode(node);
            });
            this.accumulatedSSML += `</${currentNode.type}>`;
        }
        else {
            this.accumulatedSSML += this.noChildrenNodeToText(currentNode);
        }
    }
    splitTextNode(node) {
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
        if (this.textLength > this.options.softLimit) {
            polly_text_split_1.default.configure({
                hardLimit: this.options.hardLimit,
                softLimit: this.options.softLimit,
                extraSplitChars: this.options.extraSplitChars ? this.options.extraSplitChars : undefined,
            });
            polly_text_split_1.default.split(this.accumulatedSSML).forEach((text) => {
                this.makeSpeakBatch(text);
            });
            this.accumulatedSSML = "";
            this.textLength = 0;
        }
    }
    noChildrenNodeToText(node) {
        if (node.type === "TEXT") {
            this.textLength += node.value.length;
            return node.value;
        }
        else {
            return `<${node.type}${node.value}/>`;
        }
    }
    makeSpeakBatch(ssml) {
        this.batches.push(`<speak>${ssml}</speak>`);
    }
    addNode(parentNode, newNode) {
        if (parentNode.children) {
            parentNode.children.push(newNode);
        }
        else {
            parentNode.children = [newNode];
        }
    }
    buildTree(ssml) {
        ssml = ssml.trim();
        let text = "";
        let textHasStarted = false;
        let currentNode = this.root;
        for (let i = 0, len = ssml.length; i < len; i++) {
            if (ssml[i] === "<") {
                if (textHasStarted) {
                    textHasStarted = false;
                    const newNode = {
                        parentNode: currentNode,
                        type: "TEXT",
                        value: text,
                    };
                    this.addNode(currentNode, newNode);
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
                        value
                    };
                    this.addNode(currentNode, newNode);
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
                    this.addNode(currentNode, newNode);
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
                    this.addNode(currentNode, newNode);
                }
            }
        }
    }
}
exports.SSMLSplit = SSMLSplit;
exports.default = SSMLSplit;
