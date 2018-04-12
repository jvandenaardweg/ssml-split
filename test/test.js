// const pts = require('./polly-text-split')

// pts.splitSSML('<speak> </speak>')



// class Rejs {
//     constructor() {
//         if (fs.existsSync("rejs")) return
//         fs.mkdirSync("rejs", err => { if (err) console.log(err) })
//     }

//     // public
//     createTable(tableName) {
//         if (fs.existsSync(`./rejs/${tableName}`)) return
//         this[_resetTable](tableName)
//     }

//     newData(tableName, data) {
//         this[_modifyTable](tableName, t => t[t[0].nextId++] = data)
//     }

//     deleteById(tableName, id) {
//         this[_modifyTable](tableName, t => delete t[id])
//     }

//     dropTable(tableName) {
//         fs.unlinkSync(`./rejs/${tableName}`)
//     }

//     updateTable(tableName, data) {
//         this[_resetTable](tableName)
//         this.newData(tableName, data)
//     }

//     getTable(tableName) {
//         return JSON.parse(fs.readFileSync(`./rejs/${tableName}`, 'utf8'))
//     }

//     findId(tableName, id) {
//         return this.getTable(tableName)[id]
//     }

//     where(tableName, prop) {
//         const whereTable = this.getTable(tableName)
//         const records = _.values(whereTable)
//         records.shift() // remove the metadata
//         return _.filter(records, (record) => _.includes(record, prop))
//     }

//     [hello]() {

//     }

//     // private
//     [_replaceTable](tableName, data) {
        
//         fs.writeFileSync(`./rejs/${tableName}`, JSON.stringify(data))
//     }

//     [_resetTable](tableName) {
//         this[_replaceTable](tableName, this[_initialData](tableName))
//     }

//     [_modifyTable](tableName, fn) {
//         const table = this.getTable(tableName)
//         fn(table)
//         this[_replaceTable](tableName, table)
//     }

//     [_initialData](tableName) {
//         return { "0": { "table": tableName, nextId: 1 } }
//     }
// }

// +20dB

// const text = `
// You say, <phoneme alphabet="ipa" ph="pɪˈkɑːn">pecan</phoneme>. 
// I say, <phoneme alphabet="ipa" ph="ˈpi.kæn">pecan</phoneme>.
// `

// const {ssmlSplit} = require('../index')

// ssmlSplit.split(text)