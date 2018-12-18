const msaUser = module.exports = new Msa.Module("user")

// deps
const { promisify: prm } = require('util')
const md5 = require('md5')
const cookieParser = require('cookie-parser')
const session = require('express-session')

// params
Msa.params.user = {
	secret: "TODO"
}

// Msa app
msaUser.mdw = Msa.express.Router()
msaUser.mdw.use(cookieParser())
msaUser.mdw.use(session({ secret:Msa.params.user.secret, resave:false, saveUninitialized:false }))

// perms 
Object.assign(msaUser, require('./perm'))
const permAdmin = msaUser.permAdmin

// pages /////////////////////////////////////////////////////////////

msaUser.app.get('/', (req, res) => res.redirect('/user/login') )

msaUser.app.get('/login', msaUser.mdw, (req, res) => {
	const user = req.session.user
	res.sendPage({
		wel: '/user/msa-user-login.js',
		attrs: {
			logged: user ? true : false,
			name: user ? user.name : undefined
		}
	})
})
msaUser.app.get('/register', msaUser.mdw, (req, res) => {
	const user = req.session.user
	res.sendPage({
		wel: '/user/msa-user-register.js',
		attrs: {
			logged: user ? true : false,
			name: user ? user.name : undefined
		}
	})
})

// checkUser ///////////////////////////////////////////////////////

/*
var checkUser = msaUser.checkUser = function(user, expr, next) {
	if(_checkUser(user, expr)) {
		return true
	} else {
		next && next(user ? 403 : 401) // Forbidden : Unauthorized  // TODO: deprecate it
		return false
	}
}
var _checkUser = function(user, expr) {
// return true // TMP
	const type = typeof expr
	if(type==='function') return expr(user)
	if(type==='boolean') return expr
	if(type==='object') return _checkUserObj(user, expr)
	// nothing matched
	return false
}
var _checkUserObj = function(user, expr) {
	// TODO: arrange this code to make it mongo query compliant as most as possible
	if(!user) {
		// not logged
		if(expr===false) return true
	} else {
		//logged
		if(expr===true) return true
		// name
		var name = expr.name
		if(name) return user.name==name
		// group
		var group = expr.group, userGroups = user.groups
		if(group) return (userGroups && userGroups.indexOf(group)!=-1)
		// not
		var not = expr.not
		if(not) return (!_checkUserObj(user, not))
		// and
		var and = expr.and
		if(and) {
			for(var i=0, len=and.length; i<len; ++i)
				if(!_checkUserObj(user, and[i])) return false
			return true
		}
		// or
		var or = expr.or
		if(or) {
			for(var i=0, len=or.length; i<len; ++i)
				if(_checkUserObj(user, or[i])) return true
			return false
		}
	}
}
*/
/*
const genCheckPermMdw = ko => {
	return function(perm, val=true) {
		const permFun = (typeof perm === "function") ? perm : () => perm
		const mdw = Msa.express.Router()
		mdw.use(msaUser.mdw)
		mdw.use((req, res, next) => {
			const perm = permFun(req, res, next)
			if(!perm.checkVal(req.session.user, val))
				ko(req, res, next)
			else next()
		})
		return mdw
	}
}

msaUser.checkPermMdw = genCheckPermMdw((req, res, next) => 
	next( req.session.user ? 403 : 401 ))

msaUser.checkPermPage = genCheckPermMdw((req, res, next) =>
	res.sendPage(msaUser.unauthHtml))

const checkAdminMdw = msaUser.checkAdminMdw = msaUser.checkPermMdw(new Perm({ group:'admin' }))

msaUser.unauthHtml = {
	wel: '/user/msa-user-login.js',
	attrs: {
		unauthorized: true
	}
}
*/

// DB //////////////////////////////////////////////////////

// DB model
const { UsersDb } = require("./db")
/*const { orm, Orm } = Msa.require("db")
const UsersDb = orm.define('users', {
	name: { type: Orm.STRING, primaryKey: true },
	epass: Orm.STRING,
	email: Orm.STRING,
	groups: { type: Orm.TEXT,
		get() { const val = this.getDataValue('groups'); return val ? val.split(','): val },
		set(val) { if(val) val = val.join(','); this.setDataValue('groups', val) }
	}
})

// create table in DB
UsersDb.sync()
*/


// entry ////////////////////////////////////////////////////////////////

// replies
var replyUser = function(req, res) { res.json(req.session.user) }
var replyDone = function(req, res) { res.sendStatus(200) }

// user
msaUser.app.get('/user', msaUser.mdw, replyUser)

// logout
var logout = msaUser.logout = function(req) {
	delete req.session.user
}
var logoutMdw = function(req, res, next){
	logout(req)
	next()
}
msaUser.app.post('/logout', msaUser.mdw, logoutMdw, replyUser)

// getHtml
msaUser.getHtml = Msa.express.Router()
msaUser.getHtml.use(msaUser.mdw)
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

// login
var login = Msa.login = async function(req, name, pass, next){
	try {
		const dbUser = await UsersDb.findById(name)
		if (!dbUser) return next('Incorrect username.')
		var epass = md5(pass)
		if (dbUser.epass!=epass) return next('Incorrect password.')
		var user = req.session.user = {}
		user.name = dbUser.name
		user.groups = dbUser.groups
		next()
	} catch(err){ next(err) }
}
var loginMdw = function(req, res, next) {
	const auth = req.headers.authorization, body = req.body
	if(auth){
		var [name, pass] = auth.split(' ')[1].split(':')
	} else if(body) {
		var { name, pass } = body
	}
	if(!name) return next(400) // Bad Request
	login(req, name, pass, next)
}
msaUser.app.post('/login', msaUser.mdw, loginMdw, replyUser)

// register
var register = msaUser.register = async function(name, pass, arg1, arg2) {
	try {
		if(arg2===undefined) { var next=arg1 }
		else { var args=arg1, next=arg2 }
		// check if the user already exists
		const dbUser = await UsersDb.findById(name)
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
msaUser.app.post('/register', msaUser.mdw, registerMdw, loginMdw, replyUser)

// addGroup
var addGroup = msaUser.addGroup = async function(name, group, next) {
	try {
		const dbUser = await UsersDb.findById(name)
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
msaUser.app.post('/addGroup', msaUser.mdw, permAdmin.checkMdw(), addGroupMdw, replyDone)

// admin panel
require("./admin")


// PermParamDef /////////////////////////////

const { ParamDef } = Msa.require("params")

msaUser.PermParamDef = class extends ParamDef {
	format(val) {
		return JSON.stringify(val.expr)
	}
	parse(val) {
		return new Perm(JSON.parse(val))
	}
}

msaUser.PermNumParamDef = class extends ParamDef {
	format(val) {
		return JSON.stringify(val.expr)
	}
	parse(val) {
		return new PermNum(JSON.parse(val))
	}
}


// sheet box /////////////////////////////////////////////////////////
/*
var sheetApp = Msa.require("msa-sheet")

sheetApp.registerTemplate("msa-user-login", { wel: compUrl+'/msa-user-login-box.html' }, {
	img: "<img src='data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22%23999%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cpath%20class%3D%22path1%22%20d%3D%22M18%2022.082v-1.649c2.203-1.241%204-4.337%204-7.432%200-4.971%200-9-6-9s-6%204.029-6%209c0%203.096%201.797%206.191%204%207.432v1.649c-6.784%200.555-12%203.888-12%207.918h28c0-4.030-5.216-7.364-12-7.918z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E'>"
})
*/
