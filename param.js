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

exp.PermParamDef = Perm.genPermParamDef()

exp.PermNumParamDef = PermNum.genPermParamDef()

