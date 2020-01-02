<a name="SSMLSplit"></a>

## SSMLSplit
Creates a tree data structure from SSML text.

**Kind**: global class  

* [SSMLSplit](#SSMLSplit)
    * [new SSMLSplit(softLimit, hardLimit)](#new_SSMLSplit_new)
    * [.configure(options)](#SSMLSplit+configure)
    * [.split(ssml)](#SSMLSplit+split) ⇒ <code>Array.&lt;string&gt;</code>

<a name="new_SSMLSplit_new"></a>

### new SSMLSplit(softLimit, hardLimit)
Set default character limits.
Initialize tree.


| Param | Type |
| --- | --- |
| softLimit | <code>number</code> | 
| hardLimit | <code>number</code> | 

<a name="SSMLSplit+configure"></a>

### SSMLSplit.configure(options)
Set configuration options.
This is optional. Default options are perfect for working with AWS Polly TTS.
Notice that `softLimit` and `hardLimit` count only text characters, not SSML tags.
AWS Polly ignores SSML tags length, only text characters matter.

**Kind**: instance method of [<code>SSMLSplit</code>](#SSMLSplit)  
**Throws**:

- <code>ConfigurationValidationError</code> Argument `options` is not valid.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Object with configuration options. |
| options.softLimit | <code>number</code> | <code>1000</code> | Limit of a min batch size. |
| options.hardLimit | <code>number</code> | <code>1500</code> | Limit of a max possible batch size. |
| [options.extraSplitChars] | <code>string</code> | <code>&quot;,;&quot;</code> | String with characters, that can be used as split markers for plain text. Optional parameter. |

<a name="SSMLSplit+split"></a>

### SSMLSplit.split(ssml) ⇒ <code>Array.&lt;string&gt;</code>
Split SSML text by batches of ~1500 (by default) chars.

**Kind**: instance method of [<code>SSMLSplit</code>](#SSMLSplit)  
**Returns**: <code>Array.&lt;string&gt;</code> - Array of valid SSML strings.  
**Throws**:

- <code>NotPossibleSplitError</code> Text cannot be split, increase `hardLimit`.
- <code>SSMLParseError</code> Argument `ssml` is not a valid SSML string.


| Param | Type | Description |
| --- | --- | --- |
| ssml | <code>string</code> | String containing text with SSML tags. |

