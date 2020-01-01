# SSML Splitter

Based on [polly-ssml-split](https://github.com/oleglegun/polly-ssml-split)

## Changes in this package:
Added `includeSSMLTags: boolean` option to count characters based on the complete SSML tag and not just the included text characters.

For example:
`<speak><p>some text</p></speak>`

The default behaviour would count that as 9 characters.

With `includeSSMLTags: true` it will be count as 31 characters.

## Why?
AWS Polly just counts the characters between the SSML tags. Google's Text to Speech is a little bit different, it includes the SSML tag characters in the character count of the `5000` character limit. 

The `polly-ssml-split` library already handles splitting of SSML correctly for AWS Polly, but wasn't working properly for Google's Text to Speech.

By adding the option `includeSSMLTags` to include the SSML tag characters in the calculation on when to split the SSML, makes the library also work with Google's Text to Speech API.

This package should prevent you from seeing this error when using Google's Text to Speech API:
`INVALID_ARGUMENT: 5000 characters limit exceeded.`
