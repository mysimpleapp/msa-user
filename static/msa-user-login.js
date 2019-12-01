import { Q, ajax, importHtml } from '/msa/msa.js'

// content

const contentUnlogged = `
	<h1 class="title"></h1>
	<p class="text"></p>
	<line><input type=text name="name" placeholder="username"></line>
	<line><input type=password name="pass" placeholder="password"></line>
	<line><button class="login">Connexion</button></line>
`
const contentLogged = `
	<h1 class="title"></h1>
	<p class="text"></p>
	<line>Vous êtes connecté en tant que <b class="name"></b></line>
	<line><button class="logout">Déconnexion</button></line>
`

// style

importHtml(`<style>
	msa-user-login {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		text-align: center;
		padding: 10px;
	}
	msa-user-login line {
		display: block;
		padding: 3px;
	}
`)


// various

const defArg = function() {
	for(var i=0, len=arguments.length; i<len; ++i) {
		var arg = arguments[i]
		if(arg!==undefined && arg!==null) return arg
	}
}

// element

export class HTMLMsaUserLoginElement extends HTMLElement {}
const MsaUserLoginPt = HTMLMsaUserLoginElement.prototype

MsaUserLoginPt.Q = Q

MsaUserLoginPt.connectedCallback = function(){
	this.initUser(() => {
		this.initContent()
		this.initActions()
	})
}

const getUser = function() {
	if(window.MsaUserPrm === undefined)
		window.MsaUserPrm = ajax("GET", "/user/user")
	return window.MsaUserPrm
}

MsaUserLoginPt.initUser = function(next){
	// check if user has been provided in attributes
	if(this.hasAttribute("logged") || this.hasAttribute("unauthorized")) {
		if(this.getAttribute("logged") === "true")
			this.user = { name: this.getAttribute("name") }
		else this.user = null
		next()
	} else {
		// else, get it from server
		getUser().then(user => {
			this.user = user
			next()
		})
	}
}

MsaUserLoginPt.initContent = function(){
	// display content, in function of user
	if(this.user) this.innerHTML = contentLogged
	else this.innerHTML = contentUnlogged
	// sync
	this.sync()
}

MsaUserLoginPt.initActions = function(){
	if(this.user) {
		// logout button
		this.Q("button.logout").onclick = () => { this.postLogout() }
	} else {
		// login inputs
		this.querySelectorAll("input").forEach(input => {
			input.onkeydown = evt => {
				if(evt.key === "Enter")
					this.postLogin()
			}
		})
		// login button
		this.Q("button.login").onclick = () => { this.postLogin() }
	}
}

MsaUserLoginPt.postLogin = function(){
	const name = this.Q("input[name=name]").value,
		pass = this.Q("input[name=pass]").value
	ajax('POST', '/user/login',
		{ header:{ Authorization: "Basic "+name+":"+pass }},
		user => { if(user) location.reload() }
	)
}

MsaUserLoginPt.postLogout = function(){
	ajax('POST', '/user/logout', () => {
		location.reload()
	})
}

MsaUserLoginPt.sync = MsaUserLoginPt.attributeChangedCallback = function(){
	this.syncText()
}
MsaUserLoginPt.syncText = function(){
	// logged name
	if(this.user) this.Q(".name").textContent = this.user.name
	// read attributes
	const defaultTitle = defArg(
		this.getAttribute("title"),
		this.hasAttribute("unauthorized") ? "Unauthorized !" : null)
	const defaultText = defArg(
		this.getAttribute("text"),
		this.hasAttribute("unauthorized") ? "Please login with a user with valid privileges." : null)
	// determine titles
	const loggedTitle = defArg(
		this.getAttribute("logged-title"),
		defaultTitle)
	const loggedText = defArg(
		this.getAttribute("logged-text"),
		defaultText)
	const unloggedTitle = defArg(
		this.getAttribute("unlogged-title"),
		defaultTitle,
		"Log-in")
	const unloggedText = defArg(
		this.getAttribute("unlogged-text"),
		defaultText)

	// sync titles & texts
	if(this.user){
		_syncText(this.Q(".title"), loggedTitle)
		_syncText(this.Q(".text"), loggedText)
	} else {
		_syncText(this.Q(".title"), unloggedTitle)
		_syncText(this.Q(".text"), unloggedText)
	}
}
const _syncText = function(el, val) {
	el.style.display = val ? "" : "none"
	el.textContent = val ? val : ""
}

// register elem
customElements.define("msa-user-login", HTMLMsaUserLoginElement)

