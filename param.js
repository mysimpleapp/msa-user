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

exp.genPermParamDef = function(cls) {
	return class extends ParamDef {
		format(val){
			return val.expr
		}
		parse(val){
			return new cls(val)
		}
	}
}

exp.newPermParamDef = function(cls, defVal, kwargs) {
	const paramDef = exp.genPermParamDef(cls)
	return new paramDef(Object.assign({
		defVal: new cls(defVal)
	}, kwargs))
}

exp.PermParamDef = exp.genPermParamDef(Perm)

exp.PermNumParamDef = exp.genPermParamDef(PermNum)

