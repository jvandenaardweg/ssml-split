interface OptionsInput {
    hardLimit?: number;
    softLimit?: number;
    includeSSMLTagsInCounter?: boolean;
    extraSplitChars?: string;
}
interface Options {
    hardLimit: number;
    softLimit: number;
    includeSSMLTagsInCounter: boolean;
    extraSplitChars: string;
}
export declare class SSMLSplit {
    options: Options;
    private root;
    private batches;
    private accumulatedSSML;
    private textLength;
    private characterCounter;
    constructor(options?: OptionsInput);
    split(ssmlInput: string): string[];
    private setDefaults;
    private sanitize;
    private traverseNode;
    private splitTextNode;
    private noChildrenNodeToText;
    private makeSpeakBatch;
    private addNode;
    private buildTree;
}
export default SSMLSplit;
