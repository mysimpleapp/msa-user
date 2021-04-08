import { Q, ajax, importHtml, importOnCall } from '/msa/utils/msa-utils.js'

const addErrorPopup = importOnCall("/msa/utils/msa-utils-popup.js", "addErrorPopup")

// template

const unsignedTemplate = `
	<h1 class="title"></h1>
	<p class="text"></p>
	<line><input type=text name="name" placeholder="username"></line>
	<line><input type=password name="pass" placeholder="password"></line>
	<line><button class="signin">Connexion</button></line>
`
const signedTemplate = `
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
			window.MsaUserPrm = ajax("GET", "/msa/user/user")
		return window.MsaUserPrm
	}

	initUser(next){
		// check if user has been provided in attributes
		if(this.hasAttribute("signed") || this.hasAttribute("unauthorized")) {
			if(this.getAttribute("signed") === "true")
				this.user = { name: this.getAttribute("name") }
			else this.user = null
			next()
		} else {
			// else, get it from server
			this.getUser().then(user => {
				this.user = user
				next()
			})
		}
	}

	getSignedTemplate(){
		return signedTemplate
	}

	getUnsignedTemplate(){
		return unsignedTemplate
	}

	initContent(){
		// display content, in function of user
		if(this.user) this.innerHTML = this.getSignedTemplate()
		else this.innerHTML = this.getUnsignedTemplate()
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
		ajax('POST', '/msa/user/signin',
			{ header:{ Authorization: "Basic "+name+":"+pass }})
		.then(user => { if(user) location.reload() })
		.catch(err => addErrorPopup(this, err))
	}

	postSignout(){
		ajax('POST', '/msa/user/signout')
		.then(() => location.reload())
	}

	sync(){
		this.syncText()
	}
	syncText(){
		// signed name
		if(this.user) this.Q(".name").textContent = this.user.name
		// read attributes
		const defaultTitle = defArg(
			this.getAttribute("title"),
			this.hasAttribute("unauthorized") ? "Unauthorized !" : null)
		const defaultText = defArg(
			this.getAttribute("text"),
			this.hasAttribute("unauthorized") ? "Please signin with a user with valid privileges." : null)
		// determine titles
		const signedTitle = defArg(
			this.getAttribute("signed-title"),
			defaultTitle)
		const signedText = defArg(
			this.getAttribute("signed-text"),
			defaultText)
		const unsignedTitle = defArg(
			this.getAttribute("unsigned-title"),
			defaultTitle,
			"Log-in")
		const unsignedText = defArg(
			this.getAttribute("unsigned-text"),
			defaultText)

		// sync titles & texts
		function _syncText(el, val) {
			el.style.display = val ? "" : "none"
			el.textContent = val ? val : ""
		}
		if(this.user){
			_syncText(this.Q(".title"), signedTitle)
			_syncText(this.Q(".text"), signedText)
		} else {
			_syncText(this.Q(".title"), unsignedTitle)
			_syncText(this.Q(".text"), unsignedText)
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
