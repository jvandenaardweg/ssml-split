interface OptionsInput {
    /**
     * Default: `1500`
     *
     * The amount of characters the script will start trying to break-up your SSML in multiple parts.
     * You can tweak this number to see what works for you.
     */
    softLimit?: number;
    /**
     * Default: `3000`
     *
     * The amount of characters the script should stay below for maximum size per SSML part. If any batch size goes above this, the script will error.
     */
    hardLimit?: number;
    /**
     * Default: `false`
     *
     * Set to `true` to include the SSML tag characters in the calculation on when to split the SSML,
     * this is recommended when you work with Google's Text to Speech API.
     *
     * For example: `<speak><p>some text</p></speak>`. The default behaviour would count that as 9 characters,
     * which is fine for AWS Polly, but not for Google's Text to Speech API.
     * By setting this to `true` it will be count as 31 characters, just like Google's Text to Speech API counts it.
     *
     * This should prevent you from seeing this error when using Google's Text to Speech API: "INVALID_ARGUMENT: 5000 characters limit exceeded."
     */
    includeSSMLTagsInCounter?: boolean;
    /**
     * Default: `,;.`
     *
     * Text can be split at these given characters.
     */
    extraSplitChars?: string;
    /**
     * Default: `false`
     *
     * Set to `true` to allow the script to break up large paragraphs
     * by removing the `<p>` and replacing the `</p>` with a `<break strength="x-strong" />`,
     * which results in the same pause. Source: https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#p-tag
     *
     * This allows the script to properly split large paragraph's and to send less batches to the text to speech API's.
     *
     * It is also recommended to set this to `true` when you work with large paragraphs and experiencing errors
     * like "SSML tag appeared to be too long".
     */
    breakParagraphsAboveHardLimit?: boolean;
}
interface Options {
    hardLimit: number;
    softLimit: number;
    includeSSMLTagsInCounter: boolean;
    extraSplitChars: string;
    breakParagraphsAboveHardLimit: boolean;
}
/**
 * Creates a tree data structure from SSML text.
 * @class
 */
export declare class SSMLSplit {
    options: Options;
    private root;
    private batches;
    private accumulatedSSML;
    private textLength;
    private characterCounter;
    constructor(options?: OptionsInput);
    /**
     * Split SSML text by batches of ~3000 (by default) chars.
     *
     * @throws {NotPossibleSplitError} Text cannot be split, increase `hardLimit`.
     * @throws {SSMLParseError} Argument `ssml` is not a valid SSML string.
     */
    split(ssmlInput: string): string[];
    private setDefaults;
    private sanitize;
    private traverseNode;
    private splitTextNode;
    private noChildrenNodeToText;
    /**
     * Pushes a SSML string into the batch array
     */
    private makeSpeakBatch;
    /**
     * Adds a new tree node as a parentNode child.
     */
    private addNode;
    /**
     * Creates tree data structure from SSML text.
     */
    private buildTree;
}
export default SSMLSplit;
