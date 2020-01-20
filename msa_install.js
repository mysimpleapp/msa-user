const { promisify:prm } = require('util')
const msaUser = require('./index.js')

module.exports = async itf => {
	// create table in DB
	const { withDb } = Msa.require('db')
	await withDb(async db => {
		await db.run(
			`CREATE TABLE IF NOT EXISTS msa_users (
				id VARCHAR(255) PRIMARY KEY,
				name VARCHAR(255),
				epass VARCHAR(255),
				email VARCHAR(255),
				groups VARCHAR(1023)
			)`)
		// create an admin user (if none exists)
		if(! await hasOneAdminUser(db)){
			const [name, pwd, email] = await itf.question([{
				question: "No admin user detected. Please create one. What is its name ?"
			}, {
				question: "What is its password ?",
				type: "password"
			}, {
				question: "What is its email",
				type: "email"
			}])
			await msaUser.register(db, name, pwd, { email })
			await msaUser.addGroup(db, name, "admin")
		}
	})
}

async function hasOneAdminUser(db){
	const row = await db.getOne("SELECT COUNT(*) AS nb FROM msa_users WHERE groups LIKE ?",
		["%admin%"])
	return row.nb > 0
}

