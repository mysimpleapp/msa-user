import { Q, ajax } from '/utils/msa-utils.js'

// template

const unloggedTemplate = `
		<div><input type=text size=10 name="name" placeholder="username"></div>
		<div><input type=password size=10 name="pass" placeholder="password"></div>
		<div><button class="signin">Signin</button></div>
`

const loggedTemplate = `
	<div style="display:flex; flex-direction:row; align-items: center">
		<label class="name" style="font-weight: bold;"></label>
		<input type="image" class="signout" style="width:1em; height:1em; padding-left:5px" src='/user/img/signout'>
	</div>
`
// msa-user-signin-box

function getUser() {
	if(window.MsaUserPrm === undefined)
		window.MsaUserPrm = ajax("GET", "/user/user")
	return window.MsaUserPrm
}

export class HTMLMsaUserSigninBoxElement extends HTMLElement {

	connectedCallback(){
		getUser().then(user => {
			this.user = user
			this.initContent()
			this.initActions()
		})
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

	sync(){
		this.syncText()
	}
	syncText(){
		// logged name
		if(this.user) this.Q(".name").textContent = this.user.name
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
}

HTMLMsaUserSigninBoxElement.prototype.Q = Q

customElements.define("msa-user-signin-box", HTMLMsaUserSigninBoxElement)
