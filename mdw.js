const userMdw = module.exports = Msa.express.Router()

const cookieParser = require('cookie-parser')
const session = require('express-session')

// params
Msa.params.user = {
	secret: "TODO"
}

userMdw.use(cookieParser())
userMdw.use(session({ secret:Msa.params.user.secret, resave:false, saveUninitialized:false }))
