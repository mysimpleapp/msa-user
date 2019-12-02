import { Q, ajax, importHtml, importOnCall } from '/msa/msa.js'

const popupDeps = `
	<script type="module" src="/utils/msa-utils-popup.js"></script>`
const addErrorPopup = importOnCall(popupDeps, "MsaUtils.addErrorPopup")


const contentUnlogged = `
		<div><input type=text size=10 name="name" placeholder="username"></div>
		<div><input type=password size=10 name="pass" placeholder="password"></div>
		<div><button class="login">Login</button></div>
`

const contentLogged = `
		<div><label class="name" style="font-weight: bold;"></label></div>
		<div><input type="image" class="logout" style="width:18px; height:18px;" src='data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22%23999%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cpath%20class%3D%22path1%22%20d%3D%22M20%204.581v4.249c1.131%200.494%202.172%201.2%203.071%202.099%201.889%201.889%202.929%204.4%202.929%207.071s-1.040%205.182-2.929%207.071c-1.889%201.889-4.4%202.929-7.071%202.929s-5.182-1.040-7.071-2.929c-1.889-1.889-2.929-4.4-2.929-7.071s1.040-5.182%202.929-7.071c0.899-0.899%201.94-1.606%203.071-2.099v-4.249c-5.783%201.721-10%207.077-10%2013.419%200%207.732%206.268%2014%2014%2014s14-6.268%2014-14c0-6.342-4.217-11.698-10-13.419zM14%200h4v16h-4z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E'></div>
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
	ajax('POST', '/user/logout', () => {
		location.reload()
	})
}

// register elem
customElements.define("msa-user-login-box", HTMLMsaUserLoginBoxElement)

