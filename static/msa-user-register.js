import { Q, ajax, importHtml, importOnCall } from '/msa/utils/msa-utils.js'

const addErrorPopup = importOnCall("/msa/utils/msa-utils-popup.js", "addErrorPopup")

// template

const unsignedTemplate = `
	<h1>Register</h1>
	<line><input type=text name="name" placeholder="username"></line>
	<line><input type=password name="pass" placeholder="password"></line>
	<line><input type=text name="email" placeholder="email"></line>
	<line><button class="register">Register</button></line>`

const signedTemplate = `
	<line>Vous êtes connecté en tant que <b class="name"></b></line>
	<line><button class="signout">Déconnexion</button></line>`

// style

importHtml(`<style>
	msa-user-register {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		text-align: center;
		padding: 10px;
	}
	msa-user-register line {
		display: block;
		padding: 3px;
	}
`)

// msa-user-register

function getUser() {
	if(window.MsaUserPrm === undefined)
		window.MsaUserPrm = ajax("GET", "/user/user")
	return window.MsaUserPrm
}

export class HTMLMsaUserRegisterElement extends HTMLElement {

	connectedCallback(){
		this.initUser(() => {
			this.initContent()
			this.initActions()
		})
	}

	initUser(next){
		// check if user has been provided in attributes
		if(this.hasAttribute("signed")) {
			if(this.getAttribute("signed") === "true")
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
		if(this.user) this.Q(".name").textContent = this.user.name
	}

	initActions(){
		if(this.user) {
			// signout button
			this.Q("button.signout").onclick = () => { this.postSignout() }
		} else {
			// register inputs
			this.querySelectorAll("input").forEach(input => {
				input.onkeydown = evt => {
					if(evt.key === "Enter")
						this.postRegister()
				}
			})
			// register button
			this.Q("button.register").onclick = () => { this.postRegister() }
		}
	}

	postRegister(){
		const name = this.Q("input[name=name]").value,
			pass = this.Q("input[name=pass]").value,
			email = this.Q("input[name=email]").value
		ajax('POST', '/msa/user/register',
			{ body: { name:name, pass:pass, email:email }})
		.then(user => { if(user) location.reload() })
		.catch(err => addErrorPopup(this, err))
	}

	postSignout(){
		ajax('POST', '/msa/user/signout')
		.then(() => location.reload())
	}
}
HTMLMsaUserRegisterElement.prototype.Q = Q
customElements.define("msa-user-register", HTMLMsaUserRegisterElement)
