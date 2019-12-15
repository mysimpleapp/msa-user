const exp = module.exports = {}

const { PermBase, Perm, PermNum } = require("./perm")
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

PermBase.genPermParamDef = function() {
	return class extends ParamDef {
		format(val){
			return val.expr
		}
		prettySerialize(val){
			return val.prettyFormat()
		}
		parse(val){
			return new this(val)
		}
		getEditor(){
			return { wel: "/user/msa-user-perm-editor.js" }
		}
	}
}

PermBase.newPermParamDef = function(defVal, kwargs) {
	const paramDef = this.genPermParamDef()
	return new paramDef(Object.assign({
		defVal: new this(defVal)
	}, kwargs))
}

PermNum.genPermParamDef = function() {
	const paramDefCls = PermBase.genPermParamDef()
	const labels = this.prototype.getLabels()
	paramDefCls.prototype.getEditor = function(){
		const editor = { wel: "/user/msa-user-perm-editor.js", tag: "msa-user-perm-num-editor" }
		if(labels){
			editor.attrs = editor.attrs || {}
			editor.attrs.labels = labels.map(l => l.name)
		}
		return editor
	}
	return paramDefCls
}

exp.PermParamDef = Perm.genPermParamDef()

exp.PermNumParamDef = PermNum.genPermParamDef()