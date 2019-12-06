import { Q, ajax, importHtml, importOnCall } from '/utils/msa-utils.js'

const addErrorPopup = importOnCall("/utils/msa-utils-popup.js", "addErrorPopup")

// template

const unloggedTemplate = `
	<h1 class="title"></h1>
	<p class="text"></p>
	<line><input type=text name="name" placeholder="username"></line>
	<line><input type=password name="pass" placeholder="password"></line>
	<line><button class="signin">Connexion</button></line>
`
const loggedTemplate = `
	<h1 class="title"></h1>
	<p class="text"></p>
	<line>Vous êtes connecté en tant que <b class="name"></b></line>
	<line><button class="signout">Déconnexion</button></line>
`
// style

importHtml(`<style>
	msa-user-signin {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		text-align: center;
		padding: 10px;
	}
	msa-user-signin line {
		display: block;
		padding: 3px;
	}
`)

// msa-user-signin

export class HTMLMsaUserSigninElement extends HTMLElement {

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
			// signout button
			this.Q("button.signout").onclick = () => { this.postSignout() }
		} else {
			// signin inputs
			this.querySelectorAll("input").forEach(input => {
				input.onkeydown = evt => {
					if(evt.key === "Enter")
						this.postSignin()
				}
			})
			// signin button
			this.Q("button.signin").onclick = () => { this.postSignin() }
		}
	}

	postSignin(){
		const name = this.Q("input[name=name]").value,
			pass = this.Q("input[name=pass]").value
		ajax('POST', '/user/signin',
			{ header:{ Authorization: "Basic "+name+":"+pass }})
		.then(user => { if(user) location.reload() })
		.catch(err => addErrorPopup(this, err))
	}

	postSignout(){
		ajax('POST', '/user/signout')
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
			this.hasAttribute("unauthorized") ? "Please signin with a user with valid privileges." : null)
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
HTMLMsaUserSigninElement.prototype.Q = Q
customElements.define("msa-user-signin", HTMLMsaUserSigninElement)

// utils

function defArg () {
	for(var i=0, len=arguments.length; i<len; ++i) {
		var arg = arguments[i]
		if(arg!==undefined && arg!==null) return arg
	}
}
