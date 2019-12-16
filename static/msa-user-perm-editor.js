import { importHtml, importOnCall, Q, ajax } from '/utils/msa-utils.js'

const addInputPopup = importOnCall("/utils/msa-utils-popup.js", "addInputPopup")
const makeSuggestions = importOnCall("/utils/msa-utils-suggest.js", "makeSuggestions")

const isArr = Array.isArray

// template

const template = `
	<table class="value"=>
		<thead><tr><th>Users</th><th>Permission</th><th></th></tr></thead>
		<tbody></tbody>
	</table>
	<div class="actions">
		<input type="image" class="icon add" src="/utils/img/add">
	</div>`

const permTrTemplate = `
	<tr class="permUnit">
		<td class="user"></td>
		<td class="perm" tabindex=0></td>
		<td class="actions"><input type="image" class="icon rm" src="/utils/img/remove"></td>
	</tr>`

// style

importHtml(`<style>

	.msa-user-perm-editor .actions {
		display: flex;
		flex-direction: row;
		justify-content: end;
	}

	.msa-user-perm-editor td.user:hover, .msa-user-perm-editor td.perm:hover {
		background: lightgrey;
		cursor: pointer;
	}

	.msa-user-perm-editor input.icon {
		width: 1em;
		height:1em;
		background: white;
		margin: .5em;
		padding: .5em;
		border-radius: .5em;
		box-shadow: 1pt 1pt 3pt 1pt #aaa;
	}
	.msa-user-perm-editor input.icon:hover {
		background: lightgrey;
	}

	.msa-user-perm-editor .actions input.icon {
		margin-right: .5em;
	}

	.msa-user-perm-editor .permUnit td.actions {
		padding: 0;
	}
</style>`)

// msa-user-perm-editor

export class HTMLMsaUserPermEditorElement extends HTMLElement {

	connectedCallback(){
		this.Q = Q
		this.innerHTML = this.getTemplate()
		this.classList.add("msa-user-perm-editor")
		this.sync()
		this.initActions()
	}

	getTemplate(){
		return template
	}

	initActions(){
		this.Q("input.add").onclick = () => this.addPermUnit()
	}

	sync(name, oldVal, newVal){
		this.syncValue()
	}
	syncValue(){
		this.Q("table.value tbody").innerHTML = ""
		const valueStr = this.getAttribute("value")
		if(!valueStr) return
		let value = JSON.parse(valueStr)
		if(!value) return
		if(!isArr(value)) value = [value]
		value.forEach(val => this.addPermUnit(val))
	}

	async addPermUnit(val){
		const tbody = this.Q("table.value tbody")
		const tr = (await importHtml(permTrTemplate, tbody))[0]
		this.setPermUnitVal(tr, val)
		this.initPermUnitActions(tr)
	}

	setPermUnitVal(tr, val){
		this.setPermUnitUserVal(tr, val)
		this.setPermUnitPermVal(tr, val)
	}

	setPermUnitUserVal(tr, val){
		let userVal = tr.userVal = {}
		if(typeof val === "object"){
			if(val.name){
				userVal.type = "name"
				userVal.id = val.name
				userVal.name = val.name
			} else if(val.group){
				userVal.type = "group"
				userVal.id = val.group
				userVal.name = val.group
			}
		}
		if(!userVal.id){
			userVal.type = "group"
			userVal.id = "public"
			userVal.name = "ALL"
		}
		this.syncPermUnitUser(tr)
	}

	syncPermUnitUser(tr){
		tr.querySelector(".user").textContent = tr.userVal.name
	}

	setPermUnitPermVal(tr, val){
		if(!val) val = 0
		tr.perm = val
		this.syncPermUnitPerm(tr)
	}
	
	syncPermUnitPerm(tr){
		tr.querySelector(".perm").textContent = tr.perm
	}

	initPermUnitActions(tr){

		tr.querySelector(".user").addEventListener("click", async () => {
			addInputPopup(this, { wel:"/user/msa-user-selector.js" })
			.then(val => {
				tr.userVal = val
				this.syncPermUnitUser(tr)
			})
		})

		this.initPermUnitPermActions(tr.querySelector(".perm"))

		tr.querySelector("input.rm").onclick = () => tr.remove()
	}

	initPermUnitPermActions(permEl){
		// TODO
	}

	getValue(){
		const res = { value:[] }
		const tbody = this.Q("table.value tbody")
		tbody.querySelectorAll("tr").forEach(tr =>
			res.value.push(this.getPermUnitValue(tr)))
		res.prettyValue = this.formatPerm(res.value)
		return res
	}

	getPermUnitValue(tr){
		const userType = tr.userType
		if(userType=="name") value = { name: tr.userVal }
		else if(userType=="group") value = { group: tr.userVal }
		else return tr.userVal
	}

	formatPerm(expr){
		if(isArr(expr))
			return expr.map(e => this.formatPerm(e)).join("; ")
		if(typeof expr === "object") {
			if(expr.name) return "( name: " + expr.name + " )"
			if(expr.group) return "( group: " + expr.group + " )"
		}
		return expr ? expr : ""
	}
}

customElements.define("msa-user-perm-editor", HTMLMsaUserPermEditorElement)


export class HTMLMsaUserPermNumEditorElement extends HTMLMsaUserPermEditorElement {

	connectedCallback(){
		if(this.hasAttribute("labels"))
			this.labels = this.getAttribute("labels").split(",")
		super.connectedCallback()
	}
	initPermUnitPermActions(permEl){
		makeSuggestions(permEl, async el => this.labels, {
			waitTime: 0,
			fillTarget: (el, suggest) => el.textContent = suggest
		})
	}
	syncPermUnitPerm(tr){
		const val = tr.perm
		const prettyVal = this.labels ? this.labels[val] : val
		tr.querySelector(".perm").textContent = prettyVal
	}
	formatPerm(expr){
		if(!isArr && typeof expr === "object") {
			if(expr.or) return "( " + expr.or.map(or => this.formatPerm(or)).join(" OR ") + " )"
			if(expr.and) return "( " + expr.and.map(and => this.formatPerm(and)).join(" AND ") + " )"
		}
		if(this.labels && typeof expr === "number") {
			return this.labels[expr]
		}
		return super.formatPerm(expr)
	}
}

customElements.define("msa-user-perm-num-editor", HTMLMsaUserPermNumEditorElement)