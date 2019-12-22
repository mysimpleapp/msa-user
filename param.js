const exp = module.exports = {}

const { Perm, PermNum } = require("./perm")
const { Param, ParamDef } = Msa.require("params")

// DEPRECATED ?
exp.ParamPerm = class extends Param {
	format(val){
		return JSON.stringify(val.expr)
	}
	parse(val){
		return new Perm(JSON.parse(val))
	}
}

Perm.genPermParamDef = function() {
	return class extends ParamDef {
		format(val){
			return val.expr
		}
		parse(val){
			return new this.constructor(val)
		}
		getViewer(){
			return { wel: "/user/msa-user-perm-viewer.js" }
		}
		getEditor(){
			return { wel: "/user/msa-user-perm-editor.js" }
		}
	}
}

Perm.newPermParamDef = function(defVal, kwargs) {
	const paramDef = this.genPermParamDef()
	return new paramDef(Object.assign({
		defVal: new this(defVal)
	}, kwargs))
}

PermNum.genPermParamDef = function() {
	const paramDefCls = Perm.genPermParamDef()
	const labels = this.prototype.getLabels()
	const labelsAttr = labels ? { labels:labels.map(l => l.name) } : null
	
	paramDefCls.prototype.getViewer = function(){
		return {
			wel: "/user/msa-user-perm-viewer.js",
			tag: "msa-user-perm-num-viewer",
			attrs: labelsAttr
		}
	}
	
	paramDefCls.prototype.getEditor = function(){
		return {
			wel: "/user/msa-user-perm-editor.js",
			tag: "msa-user-perm-num-editor",
			attrs: labelsAttr
		}
	}
	
	return paramDefCls
}

exp.PermParamDef = Perm.genPermParamDef()

exp.PermNumParamDef = PermNum.genPermParamDef()