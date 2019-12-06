const exp = module.exports = {}

const userMdw = require('./mdw')

// unauthorized /////////////////////

const unauthHtml = exp.unauthHtml = {
	wel: '/user/msa-user-signin.js',
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
		if(isAdmin(user)) return true
		if(expVal === undefined) expVal = this.getDefVal()
		const val = this.exprSolve(expr, user, prevVal)
		return this._checkVal(expVal, val)
	}

	solve(user, prevVal) {
		return this.exprSolve(this.expr, user, prevVal)
	}

	exprSolve(expr, user, prevVal) {
		let val = prevVal
		if(expr !== undefined) {
			if(isArr(expr)) {
				for(let i=0, len=expr.length; i<len; ++i)
					val = this.exprSolve(expr[i], user, val)
			} else {
				if(typeof expr === "function") expr = expr(user)
				const newVal = this._solve(expr, user)
				if(newVal !== undefined) val = newVal
			}
		}
		return val
	}

	_checkVal(expVal, val) {
		return (val !== undefined) ? (val === expVal) : false
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

	// format

	prettyFormat() {
		return this.exprPrettyFormat(this.expr)
	}

	exprPrettyFormat(expr) {
		if(expr === undefined) return ""
		if(typeof expr === "function") return "[FUN]"
		if(typeof expr !== "object") return expr
		if(expr.name) return "( name: " + expr.name + " )"
		if(expr.group) return "( group: " + expr.group + " )"
		return ""
	}
}

// private methods

function getExprVal(perm, expr) {
	let val = expr.val
	if(val === undefined) val = perm.getDefVal()
	return val
}

function isAdmin(user) {
	const groups = user && user.groups
	return (groups && groups.indexOf("admin") >= 0) ? true : false
}


// Perm ////////////////////////////////

exp.Perm = class extends exp.PermBase {

	getDefVal() {
		return true
	}

	_solve(expr, user) {
		// not
		const not = expr.not
		if(not) return ! this._solve(not, user)
		// and
//		const and = expr.and
//		if(and) return and.map(a => this._solve(a, user)).reduce((acc, val) => acc && val)
		// or
//		const or = expr.or
//		if(or) return or.map(o => this._solve(o, user)).reduce((acc, val) => acc || val)
		// super
		return super._solve(expr, user)
	}

	// format

	exprPrettyFormat(expr) {
		if(isArr(expr))
			return expr.map(e => this.exprPrettyFormat(e)).join("; ")
		if(typeof expr !== "object") {
			if(expr.not) return "(NOT " + this.exprPrettyFormat(expr.not) + " )"
//			if(expr.or) return "( " + expr.or.map(or => this.exprPrettyFormat(or)).join(" OR ") + " )"
//			if(expr.and) return "( " + expr.and.map(and => this.exprPrettyFormat(and)).join(" AND ") + " )"
		}
		return super.exprPrettyFormat(expr)
	}
}

// perm instances

exp.permAdmin = new exp.Perm(false)

exp.permPublic = new exp.Perm(true)


// PermNum /////////////////////////////////

exp.PermNum = class extends exp.PermBase {

	getDefVal() {
		return Number.MAX_VALUE
	}

	_checkVal(expVal, val) {
		return (val !== undefined) ? (val >= expVal) : false
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

	// format

	exprPrettyFormat(expr) {
		if(typeof expr !== "object") {
			if(expr.or) return "( " + expr.or.map(or => this.exprPrettyFormat(or)).join(" OR ") + " )"
			if(expr.and) return "( " + expr.and.map(and => this.exprPrettyFormat(and)).join(" AND ") + " )"
		}
		if(typeof expr === "number") {
			const labels = this.getLabels()
			const label = labels ? labels[expr] : null
			if(label) return label.name
		}
		return super.exprPrettyFormat(expr)
	}
}

exp.permNumAdmin = new exp.Perm(0)

exp.permNumPublic = new exp.PermNum(Number.MAX_VALUE)


// utils

const isArr = Array.isArray