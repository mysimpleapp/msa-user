const msaAdmin = Msa.require("admin")
const { withDb } = Msa.require("db")
const { User } = require('./model')

class MsaUserAdminModule extends Msa.Module {
	constructor(){
		super()
		this.initDeps()
		this.initApp()
	}

	initDeps(){
		this.User = User
	}

	initApp(){

		this.app.get('/', (req, res) => res.sendPage({
			wel:'/user/msa-user-admin.js'
		}))
		
		this.app.get('/list', async (req, res, next) => {
			withDb(async db => {
				const dbUsers = await db.get("SELECT id, name, groups FROM msa_users")
				res.json(dbUsers.map(u => {
					return this.User.newFromDb(u)
				}))
			}).catch(next)
		})
	}
}

const msaAdminUsers = module.exports = new MsaUserAdminModule()

msaAdmin.register({
	route: '/users',
	app: msaAdminUsers.app,
	title: "Users",
	help: "Users panel"
})

