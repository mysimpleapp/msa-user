import { Q, ajax, importHtml } from '/utils/msa-utils.js'

// template

const template = `
	<h1 style="text-align:center">Users</h1>
	<table class="users" style="width:100%">
		<thead><tr><th>Name</th><th>Groups</th></tr></thead>
		<tbody></tbody>
	</table>`

// style

importHtml(`<style>
	msa-user-admin {
		padding: 20px;
	}
	msa-user-admin .updated {
		background: yellow;
	}
`)

// msa-user-admin

export default class HTMLMsaUserAdminElement extends HTMLElement {

	connectedCallback(){
		this.users = []
		this.initContent()
	}

	initContent(){
		this.innerHTML = template
		this.listUsers()
	}
	listUsers() {
		ajax('GET', '/admin/users/list', users => {
			this.users = users
			this.sync()
		})
	}
	sync() {
		const t = this.Q("table.users tbody")
		for(let user of this.users){
			const r = t.insertRow()
			r.insertCell().textContent = user.name
			r.insertCell().textContent = user.groups.join(', ')
		}
	}
}
HTMLMsaUserAdminElement.prototype.Q = Q
customElements.define("msa-user-admin", HTMLMsaUserAdminElement)
