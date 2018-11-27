import { Q, ajax, importHtml } from '/msa/msa.js'

// content

const contentUnlogged = `
	<h1>Register</h1>
	<line><input type=text name="name" placeholder="username"></line>
	<line><input type=password name="pass" placeholder="password"></line>
	<line><input type=text name="email" placeholder="email"></line>
	<line><button class="register">Register</button></line>
`
const contentLogged = `
	<line>Vous êtes connecté en tant que <b class="name"></b></line>
	<line><button class="logout">Déconnexion</button></line>
`

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

// MsaUserRegister

export class HTMLMsaUserRegisterElement extends HTMLElement {}
const MsaUserRegisterPt = HTMLMsaUserRegisterElement.prototype

MsaUserRegisterPt.Q = Q

MsaUserRegisterPt.connectedCallback = function(){
	this.initUser(() => {
		this.initContent()
		this.initActions()
	})
}

const getUser = function() {
	if(window.MsaUserPrm === undefined)
		window.MsaUserPrm = new Promise((ok, ko) => {
			ajax("GET", "/user/user", ok)
		})
	return window.MsaUserPrm
}

MsaUserRegisterPt.initUser = function(next){
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

MsaUserRegisterPt.initContent = function(){
	// display content, in function of user
	if(this.user) this.innerHTML = contentLogged
	else this.innerHTML = contentUnlogged
	if(this.user) this.Q(".name").textContent = this.user.name
}

MsaUserRegisterPt.initActions = function(){
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

MsaUserRegisterPt.postRegister = function(){
	const name = this.Q("input[name=name]").value,
		pass = this.Q("input[name=pass]").value,
		email = this.Q("input[name=email]").value
	ajax('POST', '/user/register',
		{ body: { name:name, pass:pass, email:email }},
		user => {
			if(user) location.reload()
		}
	)
}

MsaUserRegisterPt.postLogout = function(){
	ajax('POST', '/user/logout', () => {
		location.reload()
	})
}

// register elem
customElements.define("msa-user-register", HTMLMsaUserRegisterElement)
