const msaUser = module.exports = new Msa.Module()

const md5 = require('md5')

const userMdw = require('./mdw')
msaUser.userMdw = userMdw
msaUser.mdw = userMdw // TODO: deprecate

// perms 
Object.assign(msaUser, require('./perm'))
const permAdmin = msaUser.permAdmin

// param
Object.assign(msaUser, require('./param'))

// pages /////////////////////////////////////////////////////////////

msaUser.app.get('/', (req, res) => res.redirect('/user/signin') )

msaUser.app.get('/signin', userMdw, (req, res) => {
	const user = req.session.user
	res.sendPage({
		wel: '/user/msa-user-signin.js',
		attrs: {
			logged: user ? true : false,
			name: user ? user.name : undefined
		}
	})
})
msaUser.app.get('/register', userMdw, (req, res) => {
	const user = req.session.user
	res.sendPage({
		wel: '/user/msa-user-register.js',
		attrs: {
			logged: user ? true : false,
			name: user ? user.name : undefined
		}
	})
})


// DB //////////////////////////////////////////////////////

// DB model
const { Orm } = Msa.require("db")
const { UsersDb } = require("./db")


// entry ////////////////////////////////////////////////////////////////

// replies
var replyUser = function(req, res) { res.json(req.session.user) }
var replyDone = function(req, res) { res.sendStatus(200) }

// user
msaUser.app.get('/user', userMdw, replyUser)

// signout
var signout = msaUser.signout = function(req) {
	delete req.session.user
}
var signoutMdw = function(req, res, next){
	signout(req)
	next()
}
msaUser.app.post('/signout', userMdw, signoutMdw, replyUser)

// getHtml
msaUser.getHtml = Msa.express.Router()
msaUser.getHtml.use(userMdw)
msaUser.getHtml.use(function(req, res, next) {
	next({ head:
`<script>
	// MsaUser global variable
	MsaUser = ${JSON.stringify(req.session.user)}
	// deprecated
	if(!window.Msa) Msa = MySimpleApp = {};
	Msa.user = MsaUser
</script>`
	})
})

// signin
var signin = Msa.signin = async function(req, name, pass, next){
	try {
		const id = name
		const dbUser = await UsersDb.findById(id)
		if (!dbUser) return next({ code:401, text:'Incorrect username' })
		var epass = md5(pass)
		if (dbUser.epass!=epass) return next({ code:401, text:'Incorrect password' })
		var user = req.session.user = {}
		user.name = dbUser.name
		user.groups = dbUser.groups
		next()
	} catch(err){ next(err) }
}
var signinMdw = function(req, res, next) {
	const auth = req.headers.authorization, body = req.body
	if(auth){
		var [name, pass] = auth.split(' ')[1].split(':')
	} else if(body) {
		var { name, pass } = body
	}
	if(!name) return next(400) // Bad Request
	signin(req, name, pass, next)
}
msaUser.app.post('/signin', userMdw, signinMdw, replyUser)

// register
var register = msaUser.register = async function(name, pass, arg1, arg2) {
	try {
		if(arg2===undefined) { var next=arg1 }
		else { var args=arg1, next=arg2 }
		// check if the user already exists
		const id = name
		const dbUser = await UsersDb.findById(id)
		if(dbUser) return next("User id already exists.")
		// encrypt pass & transform a little bit the args
		var email = args && args.email
		var user = {
			name : name,
			email : email,
			epass : md5(pass),
			groups : []
		}
		// insert user in DB
		await UsersDb.create(user)
		next()
	} catch(err){ next(err) }
}
var registerMdw = function(req, res, next) {
	var args = req.body
	register(args.name, args.pass, args, next)
}
msaUser.app.post('/register', userMdw, registerMdw, signinMdw, replyUser)

// addGroup
var addGroup = msaUser.addGroup = async function(name, group, next) {
	try {
		const id = name
		const dbUser = await UsersDb.findById(id)
		if(!dbUser) return next("User does not exist.")
		// add group, if it does not exist yet
		var groups = dbUser.groups
		if(groups.indexOf(group) === -1) {
			groups.push(group)
			// update user in DB
			const nbRows = await UsersDb.update({ groups:groups }, { where: { name }})
			if(nbRows === 0) return next("Could not update user.")
		}
		next()
	} catch(err){ next(err) }
}
var addGroupMdw = function(req, res, next) {
	var args = req.body
	addGroup(args.name, args.group, next)
}
msaUser.app.post('/addGroup', userMdw, permAdmin.checkMdw(), addGroupMdw, replyDone)

// search

msaUser.app.get('/search', userMdw, async (req, res, next) => {
	try{
		const query = req.query
		const types = query && query.types
		const text = query && query.text
		const results = []
		if(!types || types.indexOf("user")>=0){
			const dbReq = { limit:10 }
			if(text) dbReq.where = {
				name: {
					[Orm.Op.like]: text+'%'
				}
			}
			const dbUsers = await UsersDb.findAll(dbReq)
			dbUsers.forEach(u => results.push({ type:"user", id:u.id, name:u.name }))
		}
		if(!types || types.indexOf("group")>=0){
			for(let group of ["admin", "all", "signed"]){
				if(!text || group.startsWith(text))
					results.push({ type:"group", id:group, name:group })
			}
		}
		res.json({ results })
	} catch(err){ next(err) }
})

// PermParam /////////////////////////////

const { Param } = Msa.require("params")

msaUser.PermParam = class extends Param {
	format(val) {
		return JSON.stringify(val.expr)
	}
	parse(val) {
		return new Perm(JSON.parse(val))
	}
}

msaUser.PermNumParam = class extends Param {
	format(val) {
		return JSON.stringify(val.expr)
	}
	parse(val) {
		return new PermNum(JSON.parse(val))
	}
}


// admin panel
require("./admin")

// sheet box /////////////////////////////////////////////////////////
/*
var sheetApp = Msa.require("msa-sheet")

sheetApp.registerTemplate("msa-user-signin", { wel: compUrl+'/msa-user-signin-box.html' }, {
	img: "<img src='data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22%23999%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cpath%20class%3D%22path1%22%20d%3D%22M18%2022.082v-1.649c2.203-1.241%204-4.337%204-7.432%200-4.971%200-9-6-9s-6%204.029-6%209c0%203.096%201.797%206.191%204%207.432v1.649c-6.784%200.555-12%203.888-12%207.918h28c0-4.030-5.216-7.364-12-7.918z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E'>"
})
*/
