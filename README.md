# SSML Split
[![Build Status](https://img.shields.io/github/workflow/status/jvandenaardweg/ssml-split/Publish%20NPM%20Package)](https://github.com/jvandenaardweg/ssml-split/actions)
[![Coverage Status](https://coveralls.io/repos/github/jvandenaardweg/ssml-split/badge.svg?branch=master)](https://coveralls.io/github/jvandenaardweg/ssml-split?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Splits SSML strings into batches AWS Polly ánd Google's Text to Speech API can consume.

Based on [polly-ssml-split](https://github.com/oleglegun/polly-ssml-split) by [@oleglegun](https://github.com/oleglegun)

## About
The [polly-ssml-split](https://github.com/oleglegun/polly-ssml-split) by [@oleglegun](https://github.com/oleglegun) library already handles splitting of SSML correctly for AWS Polly, but wasn't working properly for Google's Text to Speech. So I just modified the package to fit my needs.

### Changes compared to `polly-ssml-split`:
- Added `includeSSMLTagsInCounter` option to count characters based on the complete SSML tag and not just the included text characters.
- Rewrote the library to use Typescript, so you get correct type checking in your Typescript project.
- Removed the `.configure` method and use the class constructor method for it instead.
- Added `breakParagraphsAboveHardLimit` options to break up large paragraphs by removing the `<p>` and replacing the `</p>` with a `<break strength="x-strong" />`, which results in the same pause ([source](https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#p-tag)). This allows the script to properly split the paragraph and to send less batches to the text to speech API's.
- Added more tests using Jest.

## Usage:
```
npm install ssml-split --save
```

```javascript
import SSMLSplit from 'ssml-split';

const ssmlSplit = new SSMLSplit({
  softLimit: 4000, // Finds a possible split moment starting from 4000 characters
  hardLimit: 5000, // Google Text to Speech limitation
  includeSSMLTagsInCounter: true, // Set true when using Google Text to Speech API, set to false with AWS Polly
  breakParagraphsAboveHardLimit: true // Allow to split large paragraphs, set to false to keep your <p></p> intact
});

const batches = ssmlSplit.split('<speak>your long text here</speak>');
```

[API Documentation](https://github.com/jvandenaardweg/ssml-split/blob/master/API.md)

### Options
#### AWS
```javascript
new SSMLSplit({
  softLimit: 2000,
  hardLimit: 3000, // AWS Polly limitation
  includeSSMLTagsInCounter: false, // Do not count SSML tags as characters
  breakParagraphsAboveHardLimit: true, // optional, but recommended when you have large <p>'s
})
```

#### Google
```javascript
new SSMLSplit({
  softLimit: 4000,
  hardLimit: 5000, // Google Text to Speech API limitation
  includeSSMLTagsInCounter: true, // Count SSML tags as characters
  breakParagraphsAboveHardLimit: true, // optional, but recommended when you have large <p>'s
})
```

You can tweak the `softLimit` to see what works for you. I suggest you keep the `hardLimit` at the limitation limit of the respective API.


#### Option: includeSSMLTagsInCounter
By adding the option `includeSSMLTagsInCounter: true` to include the SSML tag characters in the calculation on when to split the SSML, makes the library also work with Google's Text to Speech API.

For example:
`<speak><p>some text</p></speak>`

The default behaviour would count that as 9 characters, which is fine for AWS Polly, but not for Google's Text to Speech API.

With `includeSSMLTagsInCounter: true` it will be count as 31 characters, just like Google's Text to Speech API counts it.

This should prevent you from seeing this error when using Google's Text to Speech API:

```
INVALID_ARGUMENT: 5000 characters limit exceeded.
```

### Source

> https://cloud.google.com/text-to-speech/pricing?hl=en
>
> Note that Speech Synthesis Markup Language (SSML) tags are included in the character count for billing purposes. For example, this input counts as 79 characters, including the SSML tags, newlines, and spaces:
> ```xml
> <speak>
>  <say-as interpret-as="cardinal">12345</say-as> and one more
> </speak>
> ```
