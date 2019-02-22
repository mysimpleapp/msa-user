const { promisify:prm } = require('util')
const msaUser = require('./index.js')

module.exports = async itf => {
	// create table in DB
	const { UsersDb } = require("./db")
	await UsersDb.sync()
	// create an admin user (if none exists)
	if(! await getOneAdminUser()){
		const [name, pwd, email] = await itf.question([{
			question: "No admin user detected. Please create one. What is its name ?"
		}, {
			question: "What is its password ?",
			type: "password"
		}, {
			question: "What is its email",
			type: "email"
		}])
		await prm(msaUser.register)(name, pwd, { email })
		await prm(msaUser.addGroup)(name, "admin")
	}
}

const getOneAdminUser = async () => {
	const { Orm } = Msa.require("db")
	const { UsersDb } = require("./db")
	const users = await UsersDb.findAll({ where:{ groups:{ [Orm.Op.like]:"%admin%" }}})
	const user = users.filter(user => user.groups.indexOf("admin") > -1)[0]
	return user
}

