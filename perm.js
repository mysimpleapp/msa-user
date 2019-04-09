const exp = module.exports = {}

const userMdw = require('./mdw')

// unauthorized /////////////////////

const unauthHtml = exp.unauthHtml = {
	wel: '/user/msa-user-login.js',
	attrs: {
		unauthorized: true
	}
}

// PermBase ////////////////////////

exp.PermBase = class {

	constructor(expr, kwargs) {
		this.expr = expr
		Object.assign(this, kwargs)
	}

	check(user, val) {
		return this.exprCheck(this.expr, user, val)
	}

	exprCheck(expr, user, val) {
		if(!user) return this.noMatchVal
		if(isAdmin(user)) return true
		if(val === undefined) val = this.defVal
		if(typeof expr === "function") expr = expr(user)
		const userVal = this._solveUserVal(expr, user)
		return this._checkVal(userVal, val)
	}

	_checkVal(userVal, val) {
		return userVal === val
	}

	_solveUserVal(expr, user) {
		// non object
		if(typeof expr !== "object")
			return expr
		// name
		const name = expr.name
		if(name && user.name==name)
			return getExprVal(this, expr)
		// group
		const group = expr.group, userGroups = user.groups
		if(group && userGroups && userGroups.indexOf(group)!=-1)
			return getExprVal(this, expr)
		// default
		return this.noMatchVal
	}

	// MDWS //////////////////////////////

	checkMdw(val) {
		return (req, res, next) => {
			userMdw(req, res, err => {
				if(err) return next(err)
				if(!this.check(req.session.user, val))
					next(req.session.user ? 403 : 401)
				else next()
			})
		}
	}

	exprCheckMdw(expr, val) {
		return (req, res, next) => {
			userMdw(req, res, err => {
				if(err) return next(err)
				if(!this.exprCheck(expr, req.session.user, val))
					next(req.session.user ? 403 : 401)
				else next()
			})
		}
	}

	checkPage(val) {
		return (req, res, next) => {
			userMdw(req, res, err => {
				if(err) return next(err)
				if(!this.check(req.session.user, val))
					res.sendPage(unauthHtml)
				else next()
			})
		}
	}

	exprCheckPage(expr, val) {
		return (req, res, next) => {
			userMdw(req, res, err => {
				if(err) return next(err)
				if(!this.exprCheck(expr, req.session.user, val))
					res.sendPage(unauthHtml)
				else next()
			})
		}
	}
/*
	_genCheckMdw() {
		let mdw = this._checkMdw
		if(!mdw) {
			mdw = this._checkMdw = Msa.express.Router()
			mdw.use(msaUser.mdw)
			mdw.use((req, res, next) => {
				if(!this.check(req.session.user, req.msaUserCheckVal))
					next(req.session.user ? 403 : 401)
				else next()
			})
		}
		return mdw
	}

	checkMdw(val) {
		const mdw = this._genCheckMdw()
		return (req, res, next) => {
			req.msaUserCheckVal = val
			mdw(req, res, next)
		}
	}

	checkPage(val) {
		const mdw = this._genCheckMdw()
		return (req, res, next) => {
			req.msaUserCheckVal = val
			mdw(req, res, err => {
				if(err) res.sendPage(unauthHtml)
				else next()
			})
		}
	}
*/
}
exp.PermBase.prototype.noMatchVal = false
exp.PermBase.prototype.defVal = true
exp.PermBase.prototype.adminVal = true

// private methods

function getExprVal(perm, expr) {
	let val = expr.val
	if(val === undefined) val = perm.defVal
	return val
}

function isAdmin(user) {
	const groups = user && user.groups
	return (groups && groups.indexOf("admin") >= 0) ? true : false
}


// Perm ////////////////////////////////

exp.Perm = class extends exp.PermBase {

	_solveUserVal(expr, user) {
		// not
		const not = expr.not
		if(not) return ! this._solveUserVal(not, user)
		// and
		const and = expr.and
		if(and) return and.map(a => this._solveUserVal(a, user)).reduce((acc, val) => acc && val)
		// or
		const or = expr.or
		if(or) return or.map(o => this._solveUserVal(o, user)).reduce((acc, val) => acc || val)
		// super
		return super._solveUserVal(expr, user)
	}
}


// perm instances

exp.permAdmin = new exp.Perm({ group: "admin" })

exp.permPublic = new exp.Perm(true)
exp.permPublic.noMatchVal = true


// PermNum /////////////////////////////////

exp.PermNum = class extends exp.PermBase {

	_checkVal(userVal, val) {
		return userVal >= val
	}

	_solveUserVal(expr, user) {
		// and
		const and = expr.and
		if(and) return Math.min(and.map(a => this._solveUserVal(a, user)))
		// or
		const or = expr.or
		if(or) return Math.max(or.map(o => this._solveUserVal(o, user)))
		// super
		return super._solveUserVal(expr, user)
	}
}
exp.PermNum.prototype.noMatchVal = 0
exp.PermNum.prototype.defVal = 1
exp.PermNum.prototype.adminVal = Infinity

