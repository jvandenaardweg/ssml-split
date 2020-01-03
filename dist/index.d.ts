declare const _splitTextNode: unique symbol;
declare const _noChildrenNodeToText: unique symbol;
declare const _sanitize: unique symbol;
declare const _traverseNode: unique symbol;
declare const _makeSpeakBatch: unique symbol;
declare const _addNode: unique symbol;
declare const _buildTree: unique symbol;
declare class SSMLSplit {
    constructor(softLimit: any, hardLimit: any);
    configure(options: any): void;
    split(ssml: any): any;
    [_sanitize](ssml: any): any;
    [_traverseNode](currentNode: any): void;
    [_splitTextNode](node: any): void;
    [_noChildrenNodeToText](node: any): any;
    [_makeSpeakBatch](ssml: any): void;
    [_addNode](parentNode: any, newNode: any): void;
    [_buildTree](ssml: any): void;
}
declare const _default: SSMLSplit;
export default _default;
