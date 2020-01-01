# SSML Splitter

Based on [polly-ssml-split](https://github.com/oleglegun/polly-ssml-split)

Changes in this package:
Added `includeSSMLTags` option to count characters based on the complete SSML tag.

For example:
`<speak><p>some text</p></speak>`

The default behviour would count that as 9 characters.
With `includeSSMLTags: true` it will be count as 31 characters.
