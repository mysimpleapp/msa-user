import { Q, ajax, importOnCall } from '/msa/msa.js'

const addErrorPopup = importOnCall("/utils/msa-utils-popup.js", "addErrorPopup")


const contentUnlogged = `
		<div><input type=text size=10 name="name" placeholder="username"></div>
		<div><input type=password size=10 name="pass" placeholder="password"></div>
		<div><button class="login">Login</button></div>
`

const contentLogged = `
	<div style="display:flex; flex-direction:row; align-items: center">
		<label class="name" style="font-weight: bold;"></label>
		<input type="image" class="logout" style="width:1em; height:1em; padding-left:5px" src='/user/img/logout'>
	</div>
`

export class HTMLMsaUserLoginBoxElement extends HTMLElement {}
const MsaUserLoginBoxPt = HTMLMsaUserLoginBoxElement.prototype

MsaUserLoginBoxPt.Q = Q

const getUser = function() {
	if(window.MsaUserPrm === undefined)
		window.MsaUserPrm = ajax("GET", "/user/user")
	return window.MsaUserPrm
}

MsaUserLoginBoxPt.connectedCallback = function(){
	getUser().then(user => {
		this.user = user
		this.initContent()
		this.initActions()
	})
}

MsaUserLoginBoxPt.initContent = function(){
	// display content, in function of user
	if(this.user) this.innerHTML = contentLogged
	else this.innerHTML = contentUnlogged
	// sync
	this.sync()
}

MsaUserLoginBoxPt.sync = MsaUserLoginBoxPt.attributeChangedCallback = function(){
	this.syncText()
}
MsaUserLoginBoxPt.syncText = function(){
	// logged name
	if(this.user) this.Q(".name").textContent = this.user.name
}

MsaUserLoginBoxPt.initActions = function(){
	if(this.user) {
		// logout button
		this.Q(".logout").onclick = () => { this.postLogout() }
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

MsaUserLoginBoxPt.postLogin = function(){
	const name = this.Q("input[name=name]").value,
		pass = this.Q("input[name=pass]").value
	ajax('POST', '/user/login',
		{ header:{ Authorization: "Basic "+name+":"+pass }})
	.then(user => { if(user) location.reload() })
	.catch(err => addErrorPopup(this, err))
}

MsaUserLoginBoxPt.postLogout = function(){
	ajax('POST', '/user/logout')
	.then(() => location.reload())
}

// register elem
customElements.define("msa-user-login-box", HTMLMsaUserLoginBoxElement)

