const exp = module.exports = {}

const hasGroup = exp.hasGroup = function (user, group) {
    const groups = user && user.groups
    return (groups && groups.indexOf(group) >= 0) ? true : false
}

exp.isAdmin = function (user) {
    return hasGroup(user, "admin")
}