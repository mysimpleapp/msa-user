import { Q, ajax, registerMsaBox } from '/utils/msa-utils.js'

// template

const unsignedTemplate = `
	<div><input type=text size=10 name="name" placeholder="username"></div>
	<div><input type=password size=10 name="pass" placeholder="password"></div>
	<div><button class="signin">Signin</button></div>
`

const signedTemplate = `
	<div style="display:flex; flex-direction:row; align-items: center">
		<label class="name" style="font-weight: bold;"></label>
		<input type="image" class="signout" style="width:1em; height:1em; padding-left:5px" src='/user/img/signout'>
	</div>
`

// msa-user-signin-box

export class HTMLMsaUserSigninBoxElement extends HTMLElement {

	connectedCallback(){
		this.getUser().then(user => {
			this.user = user
			this.initContent()
			this.initActions()
		})
	}

	getUser() {
		if(window.MsaUserPrm === undefined)
			window.MsaUserPrm = ajax("GET", "/user/user")
		return window.MsaUserPrm
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
			this.Q(".signout").onclick = () => { this.postSignout() }
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
		ajax('POST', '/user/signin', {
			header: { Authorization: "Basic "+name+":"+pass },
			popupError: this
		})
		.then(user => { if(user) location.reload() })
	}

	postSignout(){
		ajax('POST', '/user/signout')
		.then(() => location.reload())
	}

	sync(){
		this.syncText()
	}
	syncText(){
		// signed name
		if(this.user) this.Q(".name").textContent = this.user.name
	}
}
HTMLMsaUserSigninBoxElement.prototype.Q = Q
customElements.define("msa-user-signin-box", HTMLMsaUserSigninBoxElement)

registerMsaBox("msa-user-signin-box", {
	createBox: function(ctx) {
		return document.createElement("msa-user-signin-box")
	},
	exportBox: function(el) {
		return document.createElement("msa-user-signin-box")
	}
})

// box

export async function createMsaBox(ctx) {
	return document.createElement("msa-user-signin-box")
}

export async function exportMsaBox(el) {
	return document.createElement("msa-user-signin-box")
}