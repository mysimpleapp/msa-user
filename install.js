const { MsaUserModule } = require('./index.js')

module.exports = async itf => {
	// create an admin user (if none exists)
	if(! await hasOneAdminUser()){
		const [name, pwd, email] = await itf.question([{
			question: "No admin user detected. Please create one. What is its name ?"
		}, {
			question: "What is its password ?",
			type: "password"
		}, {
			question: "What is its email",
			type: "email"
		}])
		const msaUser = new MsaUserModule()
		await msaUser.register(name, pwd, { email })
		await msaUser.addGroup(name, "admin")
	}
}

async function hasOneAdminUser(){
	const { db } = Msa.require('db')
	const nb = await db.collection("msa_users").countDocuments({ groups: "admin" })
	return nb > 0
}

