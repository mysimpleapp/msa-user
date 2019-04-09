// DB model
const { orm, Orm } = Msa.require("db")
const UsersDb = orm.define('msa_users', {
	name: { type: Orm.STRING, primaryKey: true },
	epass: Orm.STRING,
	email: Orm.STRING,
	groups: { type: Orm.TEXT,
		get() { const val = this.getDataValue('groups'); return val ? val.split(','): [] },
		set(val) { if(val) val = val.join(','); this.setDataValue('groups', val) }
	}
})

module.exports = { UsersDb }
