const { registerAdminPanel } = Msa.require("admin")
const { db } = Msa.require("db")

class MsaUserAdminModule extends Msa.Module {
	constructor() {
		super()
		this.initApp()
	}

	initApp() {

		this.app.get('/', (req, res) => res.sendPage({
			wel: '/user/msa-user-admin.js'
		}))

		this.app.get('/list', async (req, res, next) => {
			try {
				const dbUsers = await db.collection("users").find({}).toArray()
				res.json(dbUsers)
			} catch(err) { next(err) }
		})
	}
}

const msaAdminUsers = module.exports = new MsaUserAdminModule()

registerAdminPanel({
	route: '/users',
	app: msaAdminUsers.app,
	title: "Users",
	help: "Users panel"
})

