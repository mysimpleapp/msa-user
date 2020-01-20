const exp = module.exports = {}

exp.User = class {

    formatForDb(keys){
        const dbUser = {}
        if(!keys || keys.indexOf("id")>=0)
            dbUser.id = this.id
        if(!keys || keys.indexOf("name")>=0)
            dbUser.name = this.name
        if(!keys || keys.indexOf("email")>=0)
            dbUser.email = this.email
        if(!keys || keys.indexOf("epass")>=0)
            dbUser.epass = this.epass
        if(!keys || keys.indexOf("groups")>=0)
            if(this.groups)
                dbUser.groups = this.groups.join(',')
        return dbUser
    }
    
    parseFromDb(dbUser){
        Object.assign(this, dbUser)
        if(this.groups) this.groups = this.groups.split(',')
        else this.groups = []
    }

    static newFromDb(dbUser){
        if(!dbUser) return null
        const user = new this()
        user.parseFromDb(dbUser)
        return user
    }
}