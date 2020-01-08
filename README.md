# SSML Split

Splits SSML strings into batches AWS Polly ánd Google's Text to Speech API can consume.

[![Build Status](https://img.shields.io/github/workflow/status/jvandenaardweg/ssml-split/Publish%20NPM%20Package)](https://github.com/jvandenaardweg/ssml-split/actions)
[![NPM Package](https://img.shields.io/npm/dm/ssml-split.svg)](https://npmjs.com/package/ssml-split)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/0397a395ee25486395d49ababf9407d9)](https://www.codacy.com/manual/jvandenaardweg/ssml-split?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=jvandenaardweg/ssml-split&amp;utm_campaign=Badge_Grade)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Twitter Follow](https://img.shields.io/twitter/url/https/twitter.com/jvandenaardweg.svg?style=social&label=Follow%20%40jvandenaardweg)](https://twitter.com/jvandenaardweg)

## Features

*  Splits your large SSML into batches AWS Polly and Google's Text to Speech API can consume.
*  Makes sure you stay below the API character limitations by configuring a `hardLimit`.
*  Creates the least possible batch size to limit your requests to the Text to Speech API's.
*  Will split text at the nearest `.`, `,`, `;` or space. Can be configured.
*  Sanitizes your SSML by removing new lines, excessive white spaces, and empty tags, resulting in less characters used.
*  Uses TypeScript so you can enjoy the type safety and documentation that comes with it.

Based on [polly-ssml-split](https://github.com/oleglegun/polly-ssml-split) by [@oleglegun](https://github.com/oleglegun)

## Documentation

*  [Installation](#installation) - Walk through how to install SSML Split.
*  [Usage](#usage) - Read how SSML Split works with the available options.
*  [Recommended Options](#recommended-options) - Use these options to get started quickly.
*  [Contributing](./CONTRIBUTING.md) - Become familiar with how to contribute back to SSML Split
*  [Code of Conduct](./CODE_OF_CONDUCT.md) - Be a good citizen by following these repository rules

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
  // The service you are using: "google" or "aws"
  synthesizer: 'google',
  // Finds a possible split moment starting from 4000 characters
  softLimit: 4000,
  // Google Text to Speech limitation
  hardLimit: 5000,
  // Allow to split large paragraphs, set to false to keep your <p></p> intact
  breakParagraphsAboveHardLimit: true
});

const batches = ssmlSplit.split('<speak>your long ssml here</speak>');
```


| Option              | Type | Default                       | Description                                                                           |
| ------------------- | ---- | ------------------------- | ------------------------------------------------------------------------------------- |
| `synthesizer` | `string` | `aws`  | Set to which synthesizer you are using. Useful for when you use `breakParagraphsAboveHardLimit`. It allows the library to determine the correct break length, as that differs per synthesizer service. |
| `softLimit` | `number` | `1500`  | The amount of characters the script will start trying to break-up your SSML in multiple parts. You can tweak this number to see what works for you. |
| `hardLimit` | `number` | `3000`  | The amount of characters the script should stay below for maximum size per SSML part. If any batch size goes above this, the script will error. This hard limit is the character limit of the AWS or Google API you are using. |
| `breakParagraphsAboveHardLimit` | `boolean` | `false` | Set to `true` to allow the script to break up large paragraphs by removing the `<p>` and replacing the `</p>` with a `<break strength="x-strong" />` (for `aws`) or `<break strength="x-weak" />` (for `google`). Which results in the same pause. Requires option `synthesizer` to be set. |
| `extraSplitChars` | `string` | `,;.` | Characters that can be used as split markers for plain text.

### About: synthesizer
By using the option `synthesizer: 'google'` the library will include counting SSML tags characters to determine the best possible split moment. This makes the library also work with Google's Text to Speech API.

For example:
`<speak><p>some text</p></speak>`

The default behaviour would count that as 9 characters, which is fine for AWS Polly, but not for Google's Text to Speech API.

With `synthesizer: 'google'` it will be count as 31 characters, [just like Google's Text to Speech API counts it](https://cloud.google.com/text-to-speech/pricing?hl=en).

This should prevent you from seeing this error when using Google's Text to Speech API:

```bash
INVALID_ARGUMENT: 5000 characters limit exceeded.
```

### About: breakParagraphsAboveHardLimit
By adding the option `breakParagraphsAboveHardLimit: true` you allow the script to break up large paragraphs by removing the `<p>` and replacing the `</p>` with a `<break strength="x-strong" />` for AWS or `<break strength="x-weak" />` for Google. Which results in the same pause. This allows the library to properly split large paragraphs.

Using this option will result in 20 more characters, per paragraph, to your usage when using Google's Text to Speech API.

If you work with large paragraphs and you do not use this option, you might run into errors like `SSML tag appeared to be too long`.

Using this option is recommended when you have SSML length that goes above the `hardLimit`.

### Recommended options
#### AWS
```javascript
new SSMLSplit({
  synthesizer: 'aws',
  softLimit: 2000,
  hardLimit: 3000, // AWS Polly limitation
  breakParagraphsAboveHardLimit: true, // optional, but recommended when you have large <p>'s
})
```

#### Google
```javascript
new SSMLSplit({
  synthesizer: 'google',
  softLimit: 4000,
  hardLimit: 5000, // Google Text to Speech API limitation
  breakParagraphsAboveHardLimit: true, // optional, but recommended when you have large <p>'s
})
```

## About
The [polly-ssml-split](https://github.com/oleglegun/polly-ssml-split) by [@oleglegun](https://github.com/oleglegun) library already handles splitting of SSML correctly for AWS Polly, but wasn't working properly for Google's Text to Speech. So I just modified the package to fit my needs.

### Changes compared to `polly-ssml-split`:
*  Added `synthesizer` option to count characters based on the complete SSML tag and not just the included text characters. Which is required if you work with Google's Text to Speech API.
*  Rewrote the library to use Typescript, so you get correct type checking in your Typescript project.
*  Removed the `.configure` method and use the class constructor method for it instead.
*  Added `breakParagraphsAboveHardLimit` options to break up large paragraphs by removing the `<p>` and replacing the `</p>` with a `<break strength="x-strong" />` for AWS or `<break strength="x-weak" />` for Google. Which results in the same pause. This allows the library to properly split the paragraph and to send less batches to the text to speech API's.
*  Added more tests using Jest.

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

Build Typescript to Javascript:
```bash
$ npm run build
```

Run all tests:

```bash
$ npm test
```
