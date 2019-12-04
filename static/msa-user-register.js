import { Q, ajax, importHtml, importOnCall } from '/msa/msa.js'

const addErrorPopup = importOnCall("/utils/msa-utils-popup.js", "addErrorPopup")

// template

const unloggedTemplate = `
	<h1>Register</h1>
	<line><input type=text name="name" placeholder="username"></line>
	<line><input type=password name="pass" placeholder="password"></line>
	<line><input type=text name="email" placeholder="email"></line>
	<line><button class="register">Register</button></line>`

const loggedTemplate = `
	<line>Vous êtes connecté en tant que <b class="name"></b></line>
	<line><button class="logout">Déconnexion</button></line>`

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

// msa-user-login

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
		if(this.hasAttribute("logged")) {
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
		if(this.user) this.Q(".name").textContent = this.user.name
	}

	initActions(){
		if(this.user) {
			// logout button
			this.Q("button.logout").onclick = () => { this.postLogout() }
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
		ajax('POST', '/user/register',
			{ body: { name:name, pass:pass, email:email }})
		.then(user => { if(user) location.reload() })
		.catch(err => addErrorPopup(this, err))
	}

	postLogout(){
		ajax('POST', '/user/logout')
		.then(() => location.reload())
	}
}
HTMLMsaUserRegisterElement.prototype.Q = Q
customElements.define("msa-user-register", HTMLMsaUserRegisterElement)