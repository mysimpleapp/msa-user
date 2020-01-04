const exp = module.exports = {}

const { Perm, PermNum } = require("./perm")
const { Param } = Msa.require("params")

const ParamPerm = exp.ParamPerm = class extends Param {
	getAsJsonable(kwargs){
		const perm = this.value
		if(kwargs && kwargs.noDefaults)
			return perm.expr
		else
			return perm.getExpr()
	}
	setFromJsonable(val){
		this.value.expr = val
	}
	getViewer(){
		return { wel: "/user/msa-user-perm-viewer.js" }
	}
	getEditor(){
		return { wel: "/user/msa-user-perm-editor.js" }
	}
}

Perm.newParam = function(val) {
	const perm = new this(val)
	return new ParamPerm(perm)
}

PermNum.newParam = function(val) {
	const perm = new this(val)
	const param = new ParamPerm(perm)
	const labels = this.prototype.getLabels()
	const labelsAttr = labels ? { labels:labels.map(l => l.name) } : null
	
	param.getViewer = function(){
		return {
			wel: "/user/msa-user-perm-viewer.js",
			tag: "msa-user-perm-num-viewer",
			attrs: labelsAttr
		}
	}
	
	param.getEditor = function(){
		return {
			wel: "/user/msa-user-perm-editor.js",
			tag: "msa-user-perm-num-editor",
			attrs: labelsAttr
		}
	}
	
	return param
}