import { Q, ajax, importHtml } from '/msa/msa.js'

// content

const content = `
	<h1 style="text-align:center">Users</h1>
	<table class="users" style="width:100%">
		<thead><tr><th>Name</th><th>Groups</th></tr></thead>
		<tbody></tbody>
	</table>
`

// style

importHtml(`<style>
	msa-user-admin {
		padding: 20px;
	}
	msa-user-admin .updated {
		background: yellow;
	}
`)

// MsaUserAdmin

export default class HTMLMsaUserAdminElement extends HTMLElement {}
const MsaUserAdminPt = HTMLMsaUserAdminElement.prototype

MsaUserAdminPt.Q = Q

MsaUserAdminPt.connectedCallback = function(){
	this.users = []
	this.initContent()
}

MsaUserAdminPt.initContent = function(){
	this.innerHTML = content
	this.listUsers()
}
MsaUserAdminPt.listUsers = function() {
	ajax('GET', '/admin/users/list', users => {
		this.users = users
		this.sync()
	})
}
MsaUserAdminPt.sync = function() {
	const t = this.Q("table.users tbody")
	for(let user of this.users){
		const r = t.insertRow()
		r.insertCell().textContent = user.name
		r.insertCell().textContent = user.groups.join(', ')
	}
}

// register elem
customElements.define("msa-user-admin", HTMLMsaUserAdminElement)
