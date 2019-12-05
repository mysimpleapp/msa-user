import { Q, importHtml, importOnCall } from '/utils/msa-utils.js'

const importAsPopup = importOnCall("/utils/msa-utils-popup.js", "importAsPopup")

// template

const template = `
	<p><table class="value"=>
		<thead><tr><th>Users</th><th>Permission</th><th></th></tr></thead>
		<tbody></tbody>
	</table></p>
	<p><button class="add">Add</button><button class="save">Save</button></p>`

const permTrTemplate = `
	<tr>
		<td class="user"></td>
		<td class="perm"></td>
		<td><button class="rm">Remove</button></td>
	</tr>`

// style

importHtml(`<style>
	msa-user-perm-editor button {
		margin: 1px;
	}
</style>`)

// msa-user-perm-editor

export class HTMLMsaUserPermEditorElement extends HTMLElement {}
const MsaUserPermEditorPt = HTMLMsaUserPermEditorElement.prototype
customElements.define("msa-user-perm-editor", HTMLMsaUserPermEditorElement)

MsaUserPermEditorPt.Q = Q

MsaUserPermEditorPt.connectedCallback = function(){
	this.innerHTML = this.getTemplate()
	this.sync()
	this.initActions()
}

MsaUserPermEditorPt.getTemplate = function(){
	return template
}

MsaUserPermEditorPt.initActions = function(){
}

MsaUserPermEditorPt.sync = function(name, oldVal, newVal){
	this.syncValue()
}
MsaUserPermEditorPt.syncValue = function(){
	const tbody = this.Q("table.value tbody")
	tbody.innerHTML = ""
	const valueStr = this.getAttribute("value")
	if(!valueStr) return
	let value = JSON.parse(valueStr)
	if(!value) return
	if(!isArr(value)) value = [value]
	value.forEach(async val => {
		const tr = (await importHtml(permTrTemplate, tbody))[0]
		this.syncPermUnit(tr, val)
		this.querySelector(".user").addEventListener("click", async () => {
			const popup = await importAsPopup(this, { wel:"/user/msa-user-selector.js" })
			const userSel = popup.content
			const val = {}
			val[tr.userType] = tr.userVal
			userSel.setValue(val)
			userSel.addEventListener("validate", evt =>
				this.syncPermUnitUser(tr, evt.detail))
		})
		this.querySelector("button.rm").onclick = () => tr.remove()
	})
}

MsaUserPermEditorPt.syncPermUnit = function(tr, val){
	this.syncPermUnitUser(tr, val)
	const perm = (typeof val === "object") ? val.val : val
	this.syncPermUnitPerm(tr, val)
}

MsaUserPermEditorPt.syncPermUnitUser = function(tr, val){
	let userType, userVal
	if(typeof val === "object") {
		if(val.name) { userType="name"; userVal = val.name }
		else if(val.group) { userType="group"; userVal=val.group }
		else userType="all"
	} else {
		userType = "all"
	}
	if(userType == "all") userVal = "ALL"
	tr.userType = userType
	tr.querySelector(".user").textContent = tr.userVal = userVal
}

MsaUserPermEditorPt.syncPermUnitPerm = function(tr, val){
	tr.querySelector(".perm").textContent = tr.perm = val
}

// utils

const isArr = Array.isArray
