var fs = require('fs')
console.log('\n *START* \n')
console.log(__dirname + `/users/admin.json`)
var content = fs.readFileSync(__dirname + `/users/admin.json`)
var a = JSON.parse(content)
console.log(a.length)
// console.log('Output Content : \n' + content)
// console.log('\n *EXIT* \n')