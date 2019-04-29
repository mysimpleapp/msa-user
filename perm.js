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

	check(user, expVal, prevVal) {
		return this.exprCheck(this.expr, user, expVal, prevVal)
	}

	exprCheck(expr, user, expVal, prevVal) {
		if(expVal === undefined) expVal = this.defVal
		const val = this.exprSolve(expr, user, prevVal)
		return this._check(val, expVal)
	}

	solve(user, prevVal) {
		return this.exprCheck(this.expr, user, prevVal)
	}

	exprSolve(expr, user, prevVal) {
		if(prevVal===undefined) prevVal = this.getDefaultVal(user)
		if(typeof expr === "function") expr = expr(user)
		const val = this._solve(expr, user)
		return (val === undefined) ? prevVal : val
	}

	getDefaultVal(user) {
		return isAdmin(user)
	}

	_check(val, expVal) {
		return val === expVal
	}

	_solve(expr, user) {
		// non object
		if(typeof expr !== "object")
			return expr
		// name
		const name = expr.name
		if(name && user && user.name==name)
			return getExprVal(this, expr)
		// group
		const group = expr.group, userGroups = user && user.groups
		if(group && userGroups && userGroups.indexOf(group)!=-1)
			return getExprVal(this, expr)
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
}
exp.PermBase.prototype.defVal = true

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

	_solve(expr, user) {
		// not
		const not = expr.not
		if(not) return ! this._solve(not, user)
		// and
		const and = expr.and
		if(and) return and.map(a => this._solve(a, user)).reduce((acc, val) => acc && val)
		// or
		const or = expr.or
		if(or) return or.map(o => this._solve(o, user)).reduce((acc, val) => acc || val)
		// super
		return super._solve(expr, user)
	}
}


// perm instances

exp.permAdmin = new exp.Perm({ group: "admin" })

exp.permPublic = new exp.Perm(true)


// PermNum /////////////////////////////////

exp.PermNum = class extends exp.PermBase {

	_check(val, expVal) {
		return val >= expVal
	}

	_solve(expr, user) {
		// and
		const and = expr.and
		if(and) return Math.min(and.map(a => this._solve(a, user)))
		// or
		const or = expr.or
		if(or) return Math.max(or.map(o => this._solve(o, user)))
		// super
		return super._solve(expr, user)
	}
}
exp.PermNum.prototype.defVal = 1

