# Polly SSML Splitter

[![Build Status](https://travis-ci.org/oleglegun/polly-ssml-split.svg?branch=master)](https://travis-ci.org/oleglegun/polly-ssml-split)
[![Coverage Status](https://coveralls.io/repos/github/oleglegun/polly-ssml-split/badge.svg?branch=master)](https://coveralls.io/github/oleglegun/polly-ssml-split?branch=master)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat)](https://github.com/prettier/prettier)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> If you need a **plain text** splitter for working with [AWS Polly TTS](https://aws.amazon.com/ru/polly/) - check my [Polly Text Splitter](https://github.com/oleglegun/polly-text-split) library.

## Synopsis

Split text with SSML tags into batches with size of <= 1500 characters to overcome [AWS Polly TTS](https://aws.amazon.com/ru/polly/) input limitations.

## Motivation

When you use method `synthesizeSpeech()` of [AWS Polly TTS](https://aws.amazon.com/ru/polly/) SDK you cannot pass more than 1500 characters at a time. If you have a long text with SSML tags, it can become tedious to manually split it at the right positions, considering that you have to look for open/close SSML tags in order to make the input valid. This library solves this problem by splitting your text with SSML tags by batches suitable for Polly input.

Also, given that the AWS Polly is a context aware text-to-speech system, it adjusts speech pronunciation and accents based on punctuation too. So this library tries to keep speech natural by splitting only at the right places:

1.  at the nearest dot `.`
2.  if (1) not found - split by `,` or `;` (by default, can be configured)
3.  if (2) not found - split by space ``
4.  if (3) not found - hard split at the `HARD_LIMIT` index


## Installation

`npm install polly-ssml-split`

## Code Example

### Basic usage

```js
const pollySSMLSplit = require('polly-ssml-split')

// Method split() returns array of strings.
// You can pass text wrapped with <speak> tag or without it
const batches = pollySSMLSplit.split('<speak>your long text with SSML tags here</speak>')

// batches: ['<speak>Your long ...</speak>', '<speak>...</speak>', ...]
```

### Configuration

By default, configuration is not necessary, but if you need to set your own limits or split characters, you can use method `configure()` for that.

```js
const pollySSMLSplit = require('polly-ssml-split')

// Configuration example with default values
const options = {
    // MIN length of a single batch of split text
    softLimit: 1000,
    // MAX length of a single batch of split text
    hardLimit: 1500,
    // Set of extra split characters (Optional property)
    extraSplitChars: ',;',
}

// Apply configuration
pollySSMLSplit.configure(options)

// Use with new configuration
const batches = pollySSMLSplit.split('<speak>your long text here</speak>')
```

[API documentation](./API.md)

## Under the hood

This library takes your input text with SSML tags, parses it into a tree of SSML tags. Then it traverses the tree while checking for a suitable split position (where SSML semantics remain valid). When the position is found, it makes a split. After that it continues until the tree traversal is not finished. Finally it returns an array of split strings, that you can directly use with the **AWS-SDK Polly**'s [`synthesizeSpeech()`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Polly.html#synthesizeSpeech-property) method.

## Tests

`npm test`

## Contributors

Any contributions are very welcome.

## License

MIT.

## Changelog

### [0.1.0] - 2018-04-24
- Initial release.