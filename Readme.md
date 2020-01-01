# SSML Splitter

Based on [polly-ssml-split](https://github.com/oleglegun/polly-ssml-split)

## Changes in this package:
Added `includeSSMLTagsInCounter: boolean` option to count characters based on the complete SSML tag and not just the included text characters.

For example:
`<speak><p>some text</p></speak>`

The default behaviour would count that as 9 characters, which is fine for AWS Polly, but not for Google's Text to Speech API.

With `includeSSMLTagsInCounter: true` it will be count as 31 characters, just like Google's Text to Speech API counts it.


### Example:
```javascript
const ssmlSplit = require('ssml-split')

const options = {
  softLimit: 4000, // Allow the splitter to find the correct split moment between 4000-5000 characters
  hardLimit: 5000, // Google Text to Speech limitation
  includeSSMLTagsInCounter: true // Set true when using Google Text to Speech API, set to false with AWS Polly
}

pollySSMLSplit.configure(options)

const batches = ssmlSplit.split('<speak>your long text here</speak>')
```

## Why?
AWS Polly just counts the characters between the SSML tags. Google's Text to Speech is a little bit different, it includes the SSML tag characters in the character count of the `5000` character limit. 

The `polly-ssml-split` library already handles splitting of SSML correctly for AWS Polly, but wasn't working properly for Google's Text to Speech.

> https://cloud.google.com/text-to-speech/pricing?hl=en
>
> Note that Speech Synthesis Markup Language (SSML) tags are included in the character count for billing purposes. For example, this input counts as 79 characters, including the SSML tags, newlines, and spaces:
> ```xml
> <speak>
>  <say-as interpret-as="cardinal">12345</say-as> and one more
> </speak>
> ```

By adding the option `includeSSMLTags` to include the SSML tag characters in the calculation on when to split the SSML, makes the library also work with Google's Text to Speech API.

This package should prevent you from seeing this error when using Google's Text to Speech API:
`INVALID_ARGUMENT: 5000 characters limit exceeded.`
