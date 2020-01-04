<a name="SSMLSplit"></a>

## SSMLSplit
Creates a tree data structure from SSML text.

**Kind**: global class  

* [SSMLSplit](#SSMLSplit)
    * [new SSMLSplit(options)](#new_SSMLSplit_new)
    * [.split(ssml)](#SSMLSplit+split) ⇒ <code>Array.&lt;string&gt;</code>

<a name="new_SSMLSplit_new"></a>

### new SSMLSplit(options)
Set default character limits.
Initialize tree.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Object with configuration options. |
| options.softLimit | <code>number</code> | <code>1500</code> | Limit of a min batch size. |
| options.hardLimit | <code>number</code> | <code>3000</code> | Limit of a max possible batch size. |
| options.extraSplitChars | <code>string</code> | <code>&quot;,;&quot;</code> | String with characters, that can be used as split markers for plain text. Optional parameter. |
| options.includeSSMLTagsInCounter | <code>boolean</code> | <code>false</code> | Set true to include ssml tag characters in the counting
| options.breakParagraphsAboveHardLimit | <code>boolean</code> | <code>false</code> | Set true to allow breaking up paragraphs for less batches. It will strip the `<p></p>` and place the `</p>` with `<break strength="x-strong" />`, which adds the same pause.

<a name="SSMLSplit+split"></a>

### SSMLSplit.split(ssml) ⇒ <code>Array.&lt;string&gt;</code>
Split SSML text by batches of ~3000 (by default) chars.

**Kind**: instance method of [<code>SSMLSplit</code>](#SSMLSplit)  
**Returns**: <code>Array.&lt;string&gt;</code> - Array of valid SSML strings.  
**Throws**:

- <code>NotPossibleSplitError</code> Text cannot be split, increase `hardLimit`.
- <code>SSMLParseError</code> Argument `ssml` is not a valid SSML string.


| Param | Type | Description |
| --- | --- | --- |
| ssml | <code>string</code> | String containing text with SSML tags. |

