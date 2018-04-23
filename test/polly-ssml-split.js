const t = require('tap')
const pollySSMLSplit = require('../lib/polly-ssml-split')

// TODO tests for splitChars, throws

const testCases = [
    {
        options: {},
        ssml: '',
        result: [],
    },
    {
        options: {
            softLimit: 5,
            hardLimit: 10,
        },
        ssml: '<speak>Hello</speak>',
        result: ['<speak>Hello</speak>'],
    },
    {
        options: {
            softLimit: 5,
            hardLimit: 10,
        },
        ssml: 'Hello',
        result: ['<speak>Hello</speak>'],
    },
    {
        options: {
            softLimit: 5,
            hardLimit: 15,
        },
        ssml: 'plain text <ssmltag>Hello</ssmltag> plain text',
        result: [
            '<speak>plain text </speak>',
            '<speak><ssmltag>Hello</ssmltag></speak>',
            '<speak> plain text</speak>',
        ],
    },
    {
        options: {
            softLimit: 5,
            hardLimit: 15,
        },
        ssml:
            '<speak>My favorite chemical element is <sub alias="aluminum">Al</sub>, but Al prefers <sub alias="magnesium">Mg</sub>.</speak>',
        result: [
            '<speak>My favorite </speak>',
            '<speak>chemical </speak>',
            '<speak>element is </speak>',
            '<speak><sub alias="aluminum">Al</sub>, but Al </speak>',
            '<speak>prefers </speak>',
            '<speak><sub alias="magnesium">Mg</sub>.</speak>',
        ],
    },
    {
        options: {
            softLimit: 20,
            hardLimit: 30,
        },
        ssml:
            '<speak>I want to tell you a secret. <amazon:effect name="whispered">I am not a real human.</amazon:effect> Can you believe it?</speak>',
        result: [
            '<speak>I want to tell you a secret. </speak>',
            '<speak><amazon:effect name="whispered">I am not a real human.</amazon:effect></speak>',
            '<speak> Can you believe it?</speak>',
        ],
    },
]

testCases.forEach(test => {
    pollySSMLSplit.configure(test.options)

    t.same(pollySSMLSplit.split(test.ssml), test.result)
})