<a name="PollySSMLSplit"></a>

## PollySSMLSplit
Creates a tree data structure from SSML text.

**Kind**: global class  

* [PollySSMLSplit](#PollySSMLSplit)
    * [new PollySSMLSplit(softLimit, hardLimit)](#new_PollySSMLSplit_new)
    * [.configure(options)](#PollySSMLSplit+configure)
    * [.split(ssml)](#PollySSMLSplit+split) ⇒ <code>Array.&lt;string&gt;</code>

<a name="new_PollySSMLSplit_new"></a>

### new PollySSMLSplit(softLimit, hardLimit)
Set default character limits.
Initialize tree.


| Param | Type |
| --- | --- |
| softLimit | <code>number</code> | 
| hardLimit | <code>number</code> | 

<a name="PollySSMLSplit+configure"></a>

### pollySSMLSplit.configure(options)
Set configuration options.
This is optional. Default options are perfect for working with AWS Polly TTS.
Notice that `softLimit` and `hardLimit` count only text characters, not SSML tags.
AWS Polly ignores SSML tags length, only text characters matter.

**Kind**: instance method of [<code>PollySSMLSplit</code>](#PollySSMLSplit)  
**Throws**:

- <code>ConfigurationValidationError</code> Argument `options` is not valid.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Object with configuration options. |
| options.softLimit | <code>number</code> | <code>1000</code> | Limit of a min batch size. |
| options.hardLimit | <code>number</code> | <code>1500</code> | Limit of a max possible batch size. |
| [options.extraSplitChars] | <code>string</code> | <code>&quot;,;&quot;</code> | String with characters, that can be used as split markers for plain text. Optional parameter. |

<a name="PollySSMLSplit+split"></a>

### pollySSMLSplit.split(ssml) ⇒ <code>Array.&lt;string&gt;</code>
Split SSML text by batches of ~1500 (by default) chars.

**Kind**: instance method of [<code>PollySSMLSplit</code>](#PollySSMLSplit)  
**Returns**: <code>Array.&lt;string&gt;</code> - Array of valid SSML strings.  
**Throws**:

- <code>NotPossibleSplitError</code> Text cannot be split, increase `hardLimit`.
- <code>SSMLParseError</code> Argument `ssml` is not a valid SSML string.


| Param | Type | Description |
| --- | --- | --- |
| ssml | <code>string</code> | String containing text with SSML tags. |

