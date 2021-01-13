// deps
const md5 = require('md5')
const userMdw = require('./mdw')
const userPerm = require('./perm')
const permAdmin = userPerm.permAdmin
const { registerMsaBox } = Msa.require("utils")
const { db } = Msa.require("db")

// MsaUserModule

class MsaUserModule extends Msa.Module {

	constructor() {
		super()
		this.initApp()
	}

	initApp() {

		// pages
		this.app.get('/', (req, res) => res.redirect('/user/signin'))

		this.app.get('/signin', userMdw, (req, res) => {
			const user = req.session.user
			res.sendPage({
				wel: '/user/msa-user-signin.js',
				attrs: {
					signed: user ? true : false,
					name: user ? user.name : undefined
				}
			})
		})

		this.app.get('/register', userMdw, (req, res) => {
			const user = req.session.user
			res.sendPage({
				wel: '/user/msa-user-register.js',
				attrs: {
					signed: user ? true : false,
					name: user ? user.name : undefined
				}
			})
		})

		// user
		this.app.get('/user', userMdw, (req, res, next) => {
			try {
				this.replyUser(req, res)
			} catch (err) { next(err) }
		})

		// signout
		this.app.post('/signout', userMdw, (req, res, next) => {
			try {
				this.signout(req)
				this.replyUser(req, res)
			} catch (err) { next(err) }
		})

		// signin
		this.app.post('/signin', userMdw, async (req, res, next) => {
			try {
				const { key, pass } = this.getCredentials(req)
				if (!key) throw (Msa.BAD_REQUEST)
				await this.signin(req, key, pass)
				this.replyUser(req, res)
			} catch(err) { next(err) }
		})

		// register
		this.app.post('/register', userMdw, async (req, res, next) => {
			try {
				const args = req.body
				const { name, pass } = args
				const id = await this.register(name, pass, args)
				await this.signin(req, id, pass)
				this.replyUser(req, res)
			} catch(err) { next(err) }
		})

		// addGroup
		this.app.post('/addGroup', userMdw, permAdmin.checkMdw(), async (req, res, next) => {
			try {
				const { key, group } = req.body
				await addGroup(key, group)
				res.sendStatus(Msa.OK)
			} catch(err) { next(err) }
		})

		// search
		this.app.get('/search', userMdw, async (req, res, next) => {
			try {
				const query = req.query
				const types = query && query.types
				const text = query && query.text
				const results = await this.search(types, text)
				res.json({ results })
			} catch(err) { next(err) }
		})
	}

	getCredentials(req) {
		let key, pass
		const auth = req.headers.authorization, body = req.body
		if (auth) {
			const auths = auth.split(' ')[1].split(':')
			key = auths[0]
			pass = auths[1]
		} else if (body) {
			key = body.key
			pass = body.pass
		}
		return { key, pass }
	}

	replyUser(req, res) {
		res.json(req.user)
	}

	async signin(req, key, pass) {
		const id = key
		const dbUser = await this.selectUserFromDb(id)
		if (!dbUser) throw { code: 401, text: 'Unknown user key' }
		const epass = this.encryptPass(pass)
		if (dbUser.epass != epass) throw { code: 401, text: 'Incorrect password' }
		const user = req.user = req.session.user = {}
		user.name = dbUser.name
		user.groups = dbUser.groups
	}

	signout(req) {
		delete req.user
		delete req.session.user
	}

	async register(name, pass, args) {
		// check if the user already exists
		const id = this.genUserIdFromName(name)
		const dbUser = await this.selectUserFromDb(id)
		if (dbUser) throw "User id already exists."
		// encrypt pass & transform a little bit the args
		const email = args && args.email
		// insert user in DB
		await db.collection("msa_users").insertOne({
			_id:id, name, email, epass: this.encryptPass(pass), groups: []
		})
		return id
	}

	async addGroup(key, group) {
		const id = key
		const user = await this.selectUserFromDb(id)
		if (!user) throw "User does not exist."
		// add group, if it does not exist yet
		const groups = user.groups
		if (groups.indexOf(group) === -1) {
			groups.push(group)
			// update user in DB
			await db.collection("msa_users").updateOne({ _id: id }, { $set: { groups }})
		}
	}

	async search(types, text) {
		const res = []
		if (!types || types.indexOf("user") >= 0) {
			let args = text ? {'name': {'$regex': text}} : {}
			const docs = await collection("msa_users").find(args)
			docs.forEach(d => res.push({ type: "user", id: d.id, name: d.name }))
		}
		if (!types || types.indexOf("group") >= 0) {
			for (let group of ["admin", "all", "signed"]) {
				if (!text || group.startsWith(text))
					res.push({ type: "group", id: group, name: group })
			}
		}
		return res
	}

	async selectUserFromDb(id) {
		return await db.collection("msa_users").findOne({ _id:id })
	}

	genUserIdFromName(name) {
		return name
	}

	encryptPass(pass) {
		return md5(pass)
	}
}

// getHtml

const getHtmlRouter = Msa.express.Router()
getHtmlRouter.use(userMdw)
getHtmlRouter.use(function (req, res, next) {
	next({
		head:
			`<script>
	// MsaUser global variable
	MsaUser = ${JSON.stringify(req.session.user)}
	// deprecated
	if(!window.Msa) Msa = MySimpleApp = {};
	Msa.user = MsaUser
</script>`
	})
})

function getHtml(req) {
	return new Promise((ok, ko) => {
		getHtmlRouter(req, {}, ok)
	})
}

// box

registerMsaBox("msa-user-signin-box", {
	title: "Signin",
	head: "/user/msa-user-signin-box.js",
	createRef: "/user/msa-user-signin-box.js:createMsaBox",
	exportRef: "/user/msa-user-signin-box.js:exportMsaBox"
})

// admin panel
require("./admin")

// sheet box /////////////////////////////////////////////////////////
/*
var sheetApp = Msa.require("msa-sheet")

sheetApp.registerTemplate("msa-user-signin", { wel: compUrl+'/msa-user-signin-box.html' }, {
	img: "<img src='data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22%23999%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cpath%20class%3D%22path1%22%20d%3D%22M18%2022.082v-1.649c2.203-1.241%204-4.337%204-7.432%200-4.971%200-9-6-9s-6%204.029-6%209c0%203.096%201.797%206.191%204%207.432v1.649c-6.784%200.555-12%203.888-12%207.918h28c0-4.030-5.216-7.364-12-7.918z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E'>"
})
*/

module.exports = {
	installMsaModule: async itf => {
		await require("./install")(itf)
	},
	startMsaModule: () => new MsaUserModule(),
	MsaUserModule,
	getHtml,
	userMdw,
	...userPerm,
	...require('./utils'),
	...require('./param')
}