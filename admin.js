const { UsersDb } = require("./db")
const msaAdmin = Msa.require("admin")

const msaAdminUsers = module.exports = new Msa.Module()

msaAdminUsers.app.get('/', (req, res) => res.sendPage({ wel:'/user/msa-user-admin.js' }))

msaAdminUsers.app.get('/list', async (req, res, next) => {
	try {
		const users = await UsersDb.findAll()
		res.json(users.map(u => ({ id:u.id, name:u.name, groups:u.groups })))
	} catch(err) { next(err) }
})

msaAdmin.register({
	route: '/users',
	app: msaAdminUsers.app,
	title: "Users",
	help: "Users panel"
})

