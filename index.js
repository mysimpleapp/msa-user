var msaUser = module.exports = Msa.module("user")

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

// partials /////////////////////////////////////////////////////////////
msaUser.app.getAsPartial('/login', { wel: '/user/msa-user-login.html' })
msaUser.app.getAsPartial('/register', { wel: '/user/msa-user-register.html' })

// checkUser ///////////////////////////////////////////////////////

var checkUser = msaUser.checkUser = function(user, expr, next) {
	if(_checkUser(user, expr)) {
		return true
	} else {
		next && next(user ? 403 : 401) // Forbidden : Unauthorized
		return false
	}
}
var _checkUser = function(user, expr) {
//	return true // TMP
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

var checkUserMdw = msaUser.checkUserMdw = function(expr) {
  var mdw = Msa.express.Router()
  mdw.use(msaUser.mdw)
  mdw.use(function(req, res, next) {
		_checkUserMdw(req, expr, next)
	})
  return mdw
}
var checkAdminUserMdw = msaUser.checkAdminUserMdw = checkUserMdw({group:'admin'})
var _checkUserMdw = function(req, expr, next) {
	checkUser(req.session.user, expr, next) && next()
}

// DB //////////////////////////////////////////////////////

// DB model
const { UsersDb } = require("./db")
/*const { orm, Orm } = Msa.require("db")
const UsersDb = orm.define('users', {
	name: { type: Orm.STRING, primaryKey: true },
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
var replyUser = function(req, res) { res.json(req.session.user || {}) }
var replyDone = function(req, res) { res.json({done:true}) }

// islog
msaUser.app.get('/islog', msaUser.mdw, replyUser)

// logout
var logout = msaUser.logout = function(req) {
	delete req.session.user
}
var logoutMdw = function(req, res, next){
	logout(req)
	next()
}
msaUser.app.post('/logout', msaUser.mdw, logoutMdw, replyUser)

// getPartial
msaUser.getPartial = Msa.express.Router()
msaUser.getPartial.use(msaUser.mdw)
msaUser.getPartial.use(function(req, res, next) {
	res.partial = { head:
"<script> \
	if(!window.Msa) Msa = MySimpleApp = {}; \
	Msa.user = "+ JSON.stringify(req.session.user) +" \
</script>"
	}
	next()
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
	var auth = req.headers.authorization, body = req.body
	if(auth){
		var namepass = auth.split(' ')[1].split(':')
		var name = namepass[0], pass = namepass[1]
	} else if(body) {
		var name = body.name, pass = body.pass
	} else return next(400) // Bad Request
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
console.log(user)
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
msaUser.app.post('/addGroup', msaUser.mdw, checkAdminUserMdw, addGroupMdw, replyDone)
/*
// first register

msaUser.app.getAsPartial('/firstregister', { wel: '/user/msa-user-first-register.html' })

const getOneAdminUser = async function(next) {
	try {
		return await UsersDb.findAll({ where:{ groups:{ "like":"%admin%" }}})
			.filter(user => user.groups.indexOf("admin") > -1)
			[0]
	} catch(err){ next(err) }
}
const getOneAdminUserPrm = prm(getOneAdminUser)
const checkNoAdminUserMdw = async function(req, res, next) {
	try {
		const adminUser = await getOneAdminUserPrm()
		next(adminUser ? 'There is already an admin user.' : null)
	} catch(err){ next(err) }
}
const addAdminGroupMdw = function(req, res, next) {
	const args = req.body
	addGroup(args.name, 'admin', next)
}
const firstRegisterMdw = function(req, res, next) {
	if(msaUser.onFirstRegister) msaUser.onFirstRegister(next)
	else next()
}
msaUser.app.post('/firstregister', msaUser.mdw, checkNoAdminUserMdw, registerMdw, addAdminGroupMdw, loginMdw, firstRegisterMdw, replyUser)

msaUser.isFirstRegisterDone = async function(next) {
	try {
		const user = await getOneAdminUserPrm()
		user ? next(null, true) : next(null, false)
	} catch(err){ next(err) }
}
*/
// sheet box /////////////////////////////////////////////////////////
/*
var sheetApp = Msa.require("msa-sheet")

sheetApp.registerTemplate("msa-user-login", { wel: compUrl+'/msa-user-login-box.html' }, {
	img: "<img src='data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22%23999%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cpath%20class%3D%22path1%22%20d%3D%22M18%2022.082v-1.649c2.203-1.241%204-4.337%204-7.432%200-4.971%200-9-6-9s-6%204.029-6%209c0%203.096%201.797%206.191%204%207.432v1.649c-6.784%200.555-12%203.888-12%207.918h28c0-4.030-5.216-7.364-12-7.918z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E'>"
})
*/
