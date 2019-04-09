const exp = module.exports = {}

const { Perm } = require("./perm")
const { Param, ParamDef } = Msa.require("params")

exp.ParamPerm = class extends Param {
	format(val){
		return JSON.stringify(val.expr)
	}
	parse(val){
		return new Perm(JSON.parse(val))
	}
}

exp.PermParamDef = class extends ParamDef {
	format(val){
		return val.expr
	}
	parse(val){
		return new Perm(val)
	}
}
