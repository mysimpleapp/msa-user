import { Q, ajax, importHtml, importOnCall } from '/utils/msa-utils.js'

const addErrorPopup = importOnCall("/utils/msa-utils-popup.js", "addErrorPopup")

// template

const unloggedTemplate = `
	<h1 class="title"></h1>
	<p class="text"></p>
	<line><input type=text name="name" placeholder="username"></line>
	<line><input type=password name="pass" placeholder="password"></line>
	<line><button class="login">Connexion</button></line>
`
const loggedTemplate = `
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

// msa-user-login

export class HTMLMsaUserLoginElement extends HTMLElement {

	connectedCallback() {
		this.initUser(() => {
			this.initContent()
			this.initActions()
		})
	}

	getUser() {
		if(window.MsaUserPrm === undefined)
			window.MsaUserPrm = ajax("GET", "/user/user")
		return window.MsaUserPrm
	}

	initUser(next){
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

	getLoggedTemplate(){
		return loggedTemplate
	}

	getUnloggedTemplate(){
		return unloggedTemplate
	}

	initContent(){
		// display content, in function of user
		if(this.user) this.innerHTML = this.getLoggedTemplate()
		else this.innerHTML = this.getUnloggedTemplate()
		// sync
		this.sync()
	}

	initActions(){
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

	postLogin(){
		const name = this.Q("input[name=name]").value,
			pass = this.Q("input[name=pass]").value
		ajax('POST', '/user/login',
			{ header:{ Authorization: "Basic "+name+":"+pass }})
		.then(user => { if(user) location.reload() })
		.catch(err => addErrorPopup(this, err))
	}

	postLogout(){
		ajax('POST', '/user/logout')
		.then(() => location.reload())
	}

	sync(){
		this.syncText()
	}
	syncText(){
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
		function _syncText(el, val) {
			el.style.display = val ? "" : "none"
			el.textContent = val ? val : ""
		}
		if(this.user){
			_syncText(this.Q(".title"), loggedTitle)
			_syncText(this.Q(".text"), loggedText)
		} else {
			_syncText(this.Q(".title"), unloggedTitle)
			_syncText(this.Q(".text"), unloggedText)
		}
	}
}
HTMLMsaUserLoginElement.prototype.Q = Q
customElements.define("msa-user-login", HTMLMsaUserLoginElement)

// utils

function defArg () {
	for(var i=0, len=arguments.length; i<len; ++i) {
		var arg = arguments[i]
		if(arg!==undefined && arg!==null) return arg
	}
}
