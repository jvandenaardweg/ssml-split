# SSML Split

Splits SSML strings into batches AWS Polly ánd Google's Text to Speech API can consume.

[![Build Status](https://img.shields.io/github/workflow/status/jvandenaardweg/ssml-split/Publish%20NPM%20Package)](https://github.com/jvandenaardweg/ssml-split/actions)
[![NPM Package](https://img.shields.io/npm/dm/ssml-split.svg)](https://npmjs.com/package/ssml-split)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
![Twitter Follow](https://img.shields.io/twitter/follow/jvandenaardweg?style=social)

## Features

* Splits your large SSML into batches AWS Polly and Google's Text to Speech API can consume.
* Makes sure you stay below the API character limitations by configuring a `hardLimit`.
* Creates the least possible batch size to limit your requests to the Text to Speech API's.
* Will split text at the nearest `.`, `,`, `;` or space. Can be configured.
* Uses TypeScript so you can enjoy the type safety and documentation that comes with it.

Based on [polly-ssml-split](https://github.com/oleglegun/polly-ssml-split) by [@oleglegun](https://github.com/oleglegun)

## Documentation

* [Installation](#installation) - Walk through how to install SSML Split.
* [Usage](#usage) - Read how SSML Split works with the available options.
* [Recommended Options](#recommended-options) - Use these options to get started quickly.
* [Contributing](./CONTRIBUTING.md) - Become familiar with how to contribute back to SSML Split
* [Code of Conduct](./CODE_OF_CONDUCT.md) - Be a good citizen by following these repository rules


## Installation
Install the package with:

```sh
npm install ssml-split --save
```

## Usage

Import the package and set the options. Use the `.split()` method to split your SSML string. You can tweak the `softLimit` to see what works for you. I suggest you keep the `hardLimit` at the limitation limit of the respective API:

```typescript
import SSMLSplit from 'ssml-split';

const ssmlSplit = new SSMLSplit({
  softLimit: 4000, // Finds a possible split moment starting from 4000 characters
  hardLimit: 5000, // Google Text to Speech limitation
  includeSSMLTagsInCounter: true, // Set true when using Google Text to Speech API, set to false with AWS Polly
  breakParagraphsAboveHardLimit: true // Allow to split large paragraphs, set to false to keep your <p></p> intact
});

const batches = ssmlSplit.split('<speak>your long ssml here</speak>');
```


| Option              | Default                       | Description                                                                           |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `softLimit`                     | `1500`  | The amount of characters the script will start trying to break-up your SSML in multiple parts. You can tweak this number to see what works for you. |
| `hardLimit`                     | `3000`  | The amount of characters the script should stay below for maximum size per SSML part. If any batch size goes above this, the script will error. |
| `includeSSMLTagsInCounter`      | `false` | Set to `true` to include the SSML tag characters in the calculation on when to split the SSML. This is recommended when you work with Google's Text to Speech API. Set to `false` to only include text characters in the calculation, which is recommended for AWS Polly. |
| `breakParagraphsAboveHardLimit` | `false` | Set to `true` to allow the script to break up large paragraphs by removing the `<p>` and replacing the `</p>` with a `<break strength="x-strong" />`, [which results in the same pause](https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#p-tag). |
| `extraSplitChars`               | `,;.` | Characters that can be used as split markers for plain text.

### About: includeSSMLTagsInCounter
By adding the option `includeSSMLTagsInCounter: true` to include the SSML tag characters in the calculation on when to split the SSML, makes the library also work with Google's Text to Speech API.

For example:
`<speak><p>some text</p></speak>`

The default behaviour would count that as 9 characters, which is fine for AWS Polly, but not for Google's Text to Speech API.

With `includeSSMLTagsInCounter: true` it will be count as 31 characters, [just like Google's Text to Speech API counts it](https://cloud.google.com/text-to-speech/pricing?hl=en).

This should prevent you from seeing this error when using Google's Text to Speech API:

```
INVALID_ARGUMENT: 5000 characters limit exceeded.
```

### About: breakParagraphsAboveHardLimit
By adding the option `breakParagraphsAboveHardLimit: true` you allow the script to break up large paragraphs by removing the `<p>` and replacing the `</p>` with a `<break strength="x-strong" />`, [which results in the same pause](https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#p-tag). This allows the script to properly split large paragraphs.

If you work with large paragraphs and you do not use this option, you might run into errors like `SSML tag appeared to be too long`.


### Recommended options
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
[API Documentation](https://github.com/jvandenaardweg/ssml-split/blob/master/API.md)

## About
The [polly-ssml-split](https://github.com/oleglegun/polly-ssml-split) by [@oleglegun](https://github.com/oleglegun) library already handles splitting of SSML correctly for AWS Polly, but wasn't working properly for Google's Text to Speech. So I just modified the package to fit my needs.

### Changes compared to `polly-ssml-split`:
- Added `includeSSMLTagsInCounter` option to count characters based on the complete SSML tag and not just the included text characters. Which is required if you work with Google's Text to Speech API.
- Rewrote the library to use Typescript, so you get correct type checking in your Typescript project.
- Removed the `.configure` method and use the class constructor method for it instead.
- Added `breakParagraphsAboveHardLimit` options to break up large paragraphs by removing the `<p>` and replacing the `</p>` with a `<break strength="x-strong" />` [which results in the same pause](https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#p-tag). This allows the script to properly split the paragraph and to send less batches to the text to speech API's.
- Added more tests using Jest.

## Development

Any contribution is appreciated! Please read our [CONTRIBUTING.md](https://github.com/jvandenaardweg/ssml-split/blob/master/CONTRIBUTING.md) on how to contribute.

Use a test-driven approach when developing new features or fixing bugs.

Develop:

```bash
$ npm install
$ npm run dev
```

Run tests on file change:

```bash
$ npm test:watch
```

Run all tests:

```bash
$ npm test
```
