# SSML Splitter

Based on [polly-ssml-split](https://github.com/oleglegun/polly-ssml-split)

Changes in this package:
Added `includeSSMLTags` option to count characters based on the complete SSML tag.

For example:
`<speak><p>some text</p></speak>`

The default behaviour would count that as 9 characters.
With `includeSSMLTags: true` it will be count as 31 characters.

## Why?
Google's Text to Speech includes the ssml tag characters in the character count of the `5000` character limit. The `polly-ssml-split` library already handles splitting of SSML correctly, but wasn't working properly for Google's Text to Speech limitations.

This package should prevent you from seeing this error when using Google's Text to Speech API:
`INVALID_ARGUMENT: 5000 characters limit exceeded.`
