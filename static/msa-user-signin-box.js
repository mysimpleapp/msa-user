import { ajax, registerMsaBox } from '/msa/utils/msa-utils.js'

// template

const unsignedHtml = `
	<div><input type=text size=10 name="name" placeholder="username"></div>
	<div><input type=password size=10 name="pass" placeholder="password"></div>
	<div><button class="signin">Signin</button></div>
`

const signedHtml = `
	<div style="display:flex; flex-direction:row; align-items: center">
		<label class="name" style="font-weight: bold;"></label>
		<input type="image" class="signout" style="width:1em; height:1em; padding-left:5px" src='/msa/user/img/signout'>
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
			window.MsaUserPrm = ajax("GET", "/msa/user/user")
		return window.MsaUserPrm
	}

	getSignedHtml(){
		return signedHtml
	}

	getUnsignedHtml(){
		return unsignedHtml
	}

	initContent(){
		const shdw = this.attachShadow({ mode: 'open' })
		// display content, in function of user
		if(this.user) shdw.innerHTML = this.getSignedHtml()
		else shdw.innerHTML = this.getUnsignedHtml()
		// sync
		this.sync()
	}

	initActions(){
		const shdw = this.shadowRoot
		if(this.user) {
			// signout button
			shdw.querySelector(".signout").onclick = () => { this.postSignout() }
		} else {
			// signin inputs
			shdw.querySelectorAll("input").forEach(input => {
				input.onkeydown = evt => {
					if(evt.key === "Enter")
						this.postSignin()
				}
			})
			// signin button
			shdw.querySelector("button.signin").onclick = () => { this.postSignin() }
		}
	}

	postSignin(){
		const shdw = this.shadowRoot
		const name = shdw.querySelector("input[name=name]").value,
			pass = shdw.querySelector("input[name=pass]").value
		ajax('POST', '/msa/user/signin', {
			header: { Authorization: `Basic ${name}:${pass}` },
			popupError: this
		})
		.then(user => { if(user) location.reload() })
	}

	postSignout(){
		ajax('POST', '/msa/user/signout')
		.then(() => location.reload())
	}

	sync(){
		this.syncText()
	}
	syncText(){
		const shdw = this.shadowRoot
		// signed name
		if(this.user) shdw.querySelector(".name").textContent = this.user.name
	}
}
customElements.define("msa-user-signin-box", HTMLMsaUserSigninBoxElement)

// box

registerMsaBox("msa-user-signin-box", {
	exportBox: function(el) {
		return document.createElement("msa-user-signin-box")
	}
})