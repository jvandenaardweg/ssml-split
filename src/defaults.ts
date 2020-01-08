const defaults = {
  SOFT_LIMIT: 1500,
  HARD_LIMIT: 3000,
  EXTRA_SPLIT_CHARS: ',;.',
  INCLUDE_SSML_TAGS_IN_COUNTER: false,
  BREAK_PARAGRAPHS_ABOVE_HARD_LIMIT: false,
  SYNTHESIZER: 'aws',
  AWS_PARAGRAPH_BREAK_SSML_TAG: '<break strength="x-strong" />',
  GOOGLE_PARAGRAPH_BREAK_SSML_TAG: '<break strength="x-weak" />'
}

export default defaults;
