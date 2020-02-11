const exp = module.exports = {}

const userMdw = require('./mdw')

// unauthorized /////////////////////

const unauthHtml = exp.unauthHtml = {
	wel: '/user/msa-user-signin.js',
	attrs: {
		unauthorized: true
	}
}

// Perm ////////////////////////

exp.Perm = class {

	constructor(expr, kwargs) {
		this.expr = expr
		Object.assign(this, kwargs)
	}

	getExpr() {
		const res = this.expr
		if (res !== undefined) return res
		return this.getDefaultExpr()
	}

	getDefaultExpr() { }

	getDefaultValue(user) {
		return false
	}

	getDefaultExpectedValue() {
		return true
	}

	check(user, expVal, prevVal) {
		return this.checkExpr(this.getExpr(), user, expVal, prevVal)
	}

	checkExpr(expr, user, expVal, prevVal) {
		if (isAdmin(user)) return true
		if (expVal === undefined) expVal = this.getDefaultExpectedValue()
		const val = this.solveExpr(expr, user, prevVal)
		if (val === undefined) return this.getDefaultValue(user)
		else return this._checkValue(expVal, val)
	}

	solve(user, prevVal) {
		return this.solveExpr(this.getExpr(), user, prevVal)
	}

	solveExpr(expr, user, prevVal) {
		let val = prevVal
		if (expr !== undefined) {
			if (isArr(expr)) {
				for (let i = 0, len = expr.length; i < len; ++i)
					val = this.solveExpr(expr[i], user, val)
			} else {
				const newVal = this._solve(expr, user)
				if (newVal !== undefined) val = newVal
			}
		}
		return val
	}

	_checkValue(expVal, val) {
		return val === expVal
	}

	_solve(expr, user) {
		if (isObj(expr)) {
			// user
			const userId = expr.user
			if (userId && user && user.id == userId)
				return expr.value
			// group
			const groupId = expr.group
			if (groupId === "all")
				return expr.value
			if (groupId === "signed" && user)
				return expr.value
			const userGroups = user && user.groups
			if (groupId && userGroups && userGroups.indexOf(groupId) != -1)
				return expr.value
		}
	}

	// MDWS //////////////////////////////

	checkMdw(val) {
		return (req, res, next) => {
			userMdw(req, res, err => {
				if (err) return next(err)
				if (!this.check(req.session.user, val))
					next(req.session.user ? 403 : 401)
				else next()
			})
		}
	}

	checkExprMdw(expr, val) {
		return (req, res, next) => {
			userMdw(req, res, err => {
				if (err) return next(err)
				if (!this.checkExpr(expr, req.session.user, val))
					next(req.session.user ? 403 : 401)
				else next()
			})
		}
	}

	checkPage(val) {
		return (req, res, next) => {
			userMdw(req, res, err => {
				if (err) return next(err)
				if (!this.check(req.session.user, val))
					res.sendPage(unauthHtml)
				else next()
			})
		}
	}

	checkExprPage(expr, val) {
		return (req, res, next) => {
			userMdw(req, res, err => {
				if (err) return next(err)
				if (!this.checkExpr(expr, req.session.user, val))
					res.sendPage(unauthHtml)
				else next()
			})
		}
	}

	// format

	prettyFormat() {
		return this.prettyFormatExpr(this.expr)
	}

	prettyFormatExpr(expr) {
		if (expr === undefined) return ""
		if (isArr(expr))
			return expr.map(e => this.prettyFormatExpr(e)).join("; ")
		if (expr.user) return `${expr.user}: ${this._prettyFormatValue(expr.value)}`
		if (expr.group) return `${expr.group}: ${this._prettyFormatValue(expr.value)}`
		return ""
	}

	_prettyFormatValue(val) {
		return val
	}
}


// perm instances

exp.permAdmin = new exp.Perm({ group: "all", value: false })

exp.permPublic = new exp.Perm({ group: "all", value: true })


// PermNum /////////////////////////////////

exp.PermNum = class extends exp.Perm {

	getDefaultValue(user) {
		return 0
	}

	getDefaultExpectedValue() {
		return this.getMaxValue()
	}

	getMaxValue() {
		const labels = this.getLabels()
		return labels ? (labels.length - 1) : Number.MAX_VALUE
	}

	_checkValue(expVal, val) {
		return val >= expVal
	}

	// labels

	getLabels() { }

	// format

	_prettyFormatValue(value) {
		const labels = this.getLabels()
		const label = labels ? labels[value] : null
		if (label) return label.name
		return super._prettyFormatValue(value)
	}
}

exp.permNumAdmin = new exp.PermNum({ group: "all", value: 0 })

exp.permNumPublic = new exp.PermNum({ group: "all", value: Number.MAX_VALUE })


// utils

const isArr = Array.isArray

function isObj(o) {
	return (typeof o === 'object') && (o !== null)
}

function isAdmin(user) {
	const groups = user && user.groups
	return (groups && groups.indexOf("admin") >= 0) ? true : false
}