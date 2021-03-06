import pollyTextSplit from 'polly-text-split';
import defaults from './defaults';
import { ConfigurationValidationError, NotPossibleSplitError, SSMLParseError } from './errors';

type Synthesizer = 'google' | 'aws';

export interface OptionsInput {
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
  /**
   * Default: `aws`
   *
   * Set to which synthesizer you are using. Useful for when you use `breakParagraphsAboveHardLimit: true`,
   * to set the correct break length, as that differs per service.
   */
  synthesizer?: Synthesizer;
}

export interface Options {
  hardLimit: number;
  softLimit: number;
  extraSplitChars: string;
  breakParagraphsAboveHardLimit: boolean;
  synthesizer: Synthesizer;
  defaultParagraphBreakSSMLTag: string;
}

interface Node  {
  parentNode: Node | null;
  type: string;
  value: string;
  children?: Node[];
}

interface RootNode extends Node {
  children: Node[];
}

/**
 * Creates a tree data structure from SSML text.
 * @class
 */
export class SSMLSplit {
  public options: Options;

  private root: RootNode;
  private batches: string[];
  private accumulatedSSML: string;
  private textLength: number;

  constructor(options?: OptionsInput) {
    if (options && typeof options !== 'object') {
      throw new ConfigurationValidationError('Parameter `options` must be an object.');
    }

    if (options && options.synthesizer && !['google', 'aws'].includes(options.synthesizer)) {
      throw new ConfigurationValidationError('Option `synthesizer` must be "google" or "aws".');
    }

    if (options && options.breakParagraphsAboveHardLimit && !options.synthesizer) {
      throw new ConfigurationValidationError('Option `synthesizer` is required when using `breakParagraphsAboveHardLimit`.');
    }

    this.setDefaults();

    this.options = {
      softLimit: options && options.softLimit || defaults.SOFT_LIMIT,
      hardLimit: options && options.hardLimit || defaults.HARD_LIMIT,
      extraSplitChars: options && options.extraSplitChars || defaults.EXTRA_SPLIT_CHARS,
      breakParagraphsAboveHardLimit: options && options.breakParagraphsAboveHardLimit || defaults.BREAK_PARAGRAPHS_ABOVE_HARD_LIMIT,
      synthesizer: options && options.synthesizer || defaults.SYNTHESIZER as Synthesizer,

      // Google and AWS apparently use different break strength pause lengths.
      // AWS uses "x-strong" as the paragraph break strength.
      // Google seems to use "x-weak"
      // So we have to differentiate between those services here.
      // AWS: https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#p-tag
      // Google: no documentation available about this topic, "x-weak" seems to add the same pause as </p>
      defaultParagraphBreakSSMLTag: options && options.synthesizer === 'google' ? defaults.GOOGLE_PARAGRAPH_BREAK_SSML_TAG : defaults.AWS_PARAGRAPH_BREAK_SSML_TAG
    };
  }

  /**
   * Split SSML text by batches of ~3000 (by default) chars.
   *
   * @throws {NotPossibleSplitError} Text cannot be split, increase `hardLimit`.
   * @throws {SSMLParseError} Argument `ssml` is not a valid SSML string.
   */
  public split(ssmlInput: string): string[] {
    // Set the defaults everytime we invoke split
    // So you can use the split method multiple times using the same class instance
    this.setDefaults();

    // Create a copy so ssmlInput stays intact when we replace paragraphs with breaks
    let ssmlToWorkWith = `${ssmlInput}`;

    if (this.options.breakParagraphsAboveHardLimit && ssmlToWorkWith.length > this.options.hardLimit) {
      // Remove paragraphs and replace it with a break.
      // This allows easier break up of long paragraphs, while maintaining the proper pause at the end.
      // Adding <break strength="" /> at the end of a paragraph is the same as wrapping your text inside a <p></p>
      ssmlToWorkWith = ssmlToWorkWith.replace(/<p>/g, '');
      ssmlToWorkWith = ssmlToWorkWith.replace(/<\/p>/g, this.options.defaultParagraphBreakSSMLTag);
    }

    // Sanitize and create tree
    this.buildTree(this.sanitize(ssmlToWorkWith));

    // Check if SSML is wrapped with <speak> tag
    if (this.root.children.length === 1 && this.root.children[0].type === 'speak') {
      // Remove global <speak> tag node
      // since the text will be split, new <speak> tags will wrap batches
      this.root.children = this.root.children[0].children!;
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
        if (
          node.type === 'TEXT' &&
          this.textLength + node.value.length > this.options.softLimit
        ) {
          this.splitTextNode(node);
        } else {
          // Text node is short or this is a tag node, that needs to be traversed, can't split here
          this.traverseNode(node);
        }
      } else if (this.characterCounter < this.options.hardLimit) {
        // SOFT_LIMIT is reached -> search for possible split locations
        this.makeSpeakBatch(this.accumulatedSSML);
        this.accumulatedSSML = '';
        this.textLength = 0;

        if (node.type === 'TEXT' && node.value.length > this.options.softLimit) {
          this.splitTextNode(node);
        } else {
          // Text node is short or this is a tag node, that needs to be traversed, can't split here
          this.traverseNode(node);
        }
      } else {
        throw new NotPossibleSplitError('SSML tag appeared to be too long.');
      }
    });

    if (this.characterCounter !== 0) {
      if (this.characterCounter < this.options.hardLimit) {
        this.makeSpeakBatch(this.accumulatedSSML);
      } else {
        throw new NotPossibleSplitError('Last SSML tag appeared to be too long.');
      }
    }

    return this.batches;
  }

  private get characterCounter() {
    // Since we wrap the output SSML within <speak></speak> tags,
    // we also need to include those in the calculation
    const outputSSMLLength = this.accumulatedSSML.length + '<speak></speak>'.length;

    return this.options.synthesizer === 'google' ? outputSSMLLength : this.textLength;
  }

  private setDefaults() {
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

  /**
   * Sanitizes the input SSML by removing new lines, excessive white spaces, and empty tags.
   *
   * @param ssml
   */
  private sanitize(ssml: string): string {
    return ssml
    .replace(/\r?\n|\r/g, '') // remove new lines
    .replace(/>\s+</g, '><') // remove spaces between <tags>'s
    .replace(/<p>\s+<\/p>/g, '') // Remove empty <p> </p>
    .replace(/<p><\/p>/g, '') // Remove empty <p></p>
    .replace(/<s>\s+<\/s>/g, '') // Remove empty <s> </s>
    .replace(/<s><\/s>/g, '') // Remove empty <s></s>
    .replace(/<s\/>/g, '') // Remove self-closing <s/>
    .replace(/<p\/>/g, '') // Remove self-closing <p/>
    .trim(); // remove trailing and leading white space
  }

  private traverseNode(currentNode: Node): void {
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
    } else {
      // no children
      this.accumulatedSSML += this.noChildrenNodeToText(currentNode);
    }
  }

  private splitTextNode(node: Node): void {
    // Overflows => Text node needs to be checked for possible split location
    const localSoftLimit =
      this.textLength === 0 ? this.options.softLimit : this.options.softLimit - this.textLength;
    const localHardLimit = localSoftLimit + this.options.hardLimit - this.options.softLimit;

    pollyTextSplit.configure({
      hardLimit: localHardLimit,
      softLimit: localSoftLimit,
      extraSplitChars: this.options.extraSplitChars ? this.options.extraSplitChars : undefined,
    });

    const splitIndex = pollyTextSplit.splitIndex(node.value);

    this.makeSpeakBatch(this.accumulatedSSML + node.value.slice(0, splitIndex + 1));

    this.accumulatedSSML = node.value.slice(splitIndex + 1);
    this.textLength = this.accumulatedSSML.length;

    // If the remaining TEXT value is too long again, split it
    if (this.textLength > this.options.softLimit) {
      pollyTextSplit.configure({
        hardLimit: this.options.hardLimit,
        softLimit: this.options.softLimit,
        extraSplitChars: this.options.extraSplitChars ? this.options.extraSplitChars : undefined,
      });

      // Get text batches
      pollyTextSplit.split(this.accumulatedSSML).forEach((text: string) => {
        this.makeSpeakBatch(text);
      });

      this.accumulatedSSML = '';
      this.textLength = 0;
    }
  }

  private noChildrenNodeToText(node: Node): string {
    if (node.type === 'TEXT') {
      this.textLength += node.value.length;
      return node.value;
    } else {
      // SSML empty tag (i.e. no children)
      return `<${node.type}${node.value}/>`;
    }
  }

  /**
   * Pushes a SSML string into the batch array
   */
  private makeSpeakBatch(ssml: string): void {
    this.batches.push(`<speak>${ssml}</speak>`);
  }

  /**
   * Adds a new tree node as a parentNode child.
   */
  private addNode(parentNode: Node, newNode: Node): void {
    if (parentNode.children) {
      parentNode.children.push(newNode);
    } else {
      parentNode.children = [newNode];
    }
  }

  /**
   * Creates tree data structure from SSML text.
   */
  private buildTree(ssml: string): void {
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

          const newNode: Node = {
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
        } else {
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
            } else if (ssml[j - 1] === '/') {
              // B. empty tag <tag />
              isEmptyTag = true;

              // remove last `/` char from value
              if (value.length !== 0) { value = value.slice(0, value.length - 1); }
              break;
            } else {
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
          const newNode: Node = {
            parentNode: currentNode,
            type,
            value
          };
          this.addNode(currentNode, newNode);

          if (!isEmptyTag) {
            // Not an empty tag => can have other children, then keep it active
            currentNode = newNode as RootNode;
          }
        } else if (isEmptyTag) {
          // TODO: this else if might not be needed, might be removed
          // an empty tag (<break />) cannot be an end tag (</break />), doesnt make sense

          // is an end tag + empty end tag
          const newNode: Node = {
            parentNode: currentNode,
            type,
            value,
          };
          this.addNode(currentNode, newNode);
        } else {
          // is an end tag </tag>
          // close current tag = no more children

          // sanity check
          if (currentNode.type !== type) {
            const msg = `Incorrect SSML: ${type} !== ${currentNode.type}`;
            throw new SSMLParseError(msg);
          }
          currentNode = currentNode.parentNode as RootNode;
        }

        // skip processed chars for the next iteration
        i = j;
      } else {
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
          const newNode: Node = {
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

export default SSMLSplit;
