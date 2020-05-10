const { Perm, PermNum } = require("./perm")
const { Param } = Msa.require("params/param")

const ParamPerm = class extends Param {
	getAsDbVal() {
		const perm = this.value
		return perm && perm.expr
	}
	setFromDbVal(dbVal) {
		if (dbVal === undefined) {
			this.value === undefined
		} else {
			if (!this.value) {
				const permCls = this.defaultValue.constructor
				this.value = new permCls()
			}
			this.value.expr = dbVal
		}
	}
	getAsAdminVal() {
		const perm = this.get()
		return {
			expr: perm.getExpr(),
			defVal: perm.getDefaultValue()
		}
	}
	setFromAdminVal(val) {
		this.setFromDbVal(val.expr)
	}
	getViewer() {
		return { wel: "/user/msa-user-perm-viewer.js" }
	}
	getEditor() {
		return { wel: "/user/msa-user-perm-editor.js" }
	}
}

const newParamPerm = function (permCls, defExpr) {
	return new ParamPerm(new permCls(defExpr))
}

Perm.newParam = function (defExpr) {
	return newParamPerm(this, defExpr)
}

PermNum.newParam = function (defExpr) {
	const param = newParamPerm(this, defExpr)
	const labels = this.prototype.getLabels()
	const labelsAttr = labels ? { labels: labels.map(l => l.name) } : null

	param.getViewer = function () {
		return {
			wel: "/user/msa-user-perm-viewer.js",
			tag: "msa-user-perm-num-viewer",
			attrs: labelsAttr
		}
	}

	param.getEditor = function () {
		return {
			wel: "/user/msa-user-perm-editor.js",
			tag: "msa-user-perm-num-editor",
			attrs: labelsAttr
		}
	}

	return param
}

module.exports = {
	ParamPerm,
	newParamPerm
}