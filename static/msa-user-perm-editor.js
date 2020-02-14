import { importHtml, importOnCall, Q, ajax } from '/utils/msa-utils.js'

const importAsInputPopup = importOnCall("/utils/msa-utils-popup.js", "importAsInputPopup")
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

	connectedCallback() {
		this.Q = Q
		this.innerHTML = this.getTemplate()
		this.classList.add("msa-user-perm-editor")
		this.sync()
		this.initActions()
	}

	getTemplate() {
		return template
	}

	initActions() {
		this.Q("input.add").onclick = () => this.addPermUnit()
	}

	setValue(val) {
		this.value = val
		this.syncValue()
	}

	sync(name, oldVal, newVal) {
		this.syncValue()
	}
	syncValue() {
		this.Q("table.value tbody").innerHTML = ""
		let expr = this.value && this.value.expr
		if (!expr) return
		if (!isArr(expr)) expr = [expr]
		expr.forEach(val => this.addPermUnit(val))
	}

	async addPermUnit(expr) {
		const tbody = this.Q("table.value tbody")
		const tr = (await importHtml(permTrTemplate, tbody))[0]
		this.setPermUnitExpr(tr, expr)
		this.initPermUnitActions(tr)
	}

	getDefaultPermUnitExpr() {
		return { group: "all", value: false }
	}

	setPermUnitExpr(tr, expr) {
		if (!expr) expr = this.getDefaultPermUnitExpr()
		this.setPermUnitUser(tr, expr)
		this.setPermUnitValue(tr, expr.value)
	}

	setPermUnitUser(tr, expr) {
		if (!tr.expr) tr.expr = {}
		tr.expr.user = expr.user
		tr.expr.group = expr.group
		this.syncPermUnitUser(tr)
	}
	syncPermUnitUser(tr) {
		tr.querySelector(".user").textContent = tr.expr.user || tr.expr.group
	}

	setPermUnitValue(tr, val) {
		if (!tr.expr) tr.expr = {}
		tr.expr.value = val
		this.syncPermUnitValue(tr)
	}
	syncPermUnitValue(tr) {
		tr.querySelector(".perm").textContent = tr.expr.value
	}

	initPermUnitActions(tr) {

		tr.querySelector(".user").addEventListener("click", async () => {
			importAsInputPopup(this, { wel: "/user/msa-user-selector.js" })
				.then(val => this.setPermUnitUser(tr, val))
		})

		this.initPermUnitPermActions(tr, tr.querySelector(".perm"))

		tr.querySelector("input.rm").onclick = () => tr.remove()
	}

	initPermUnitPermActions(tr, permEl) {
		// TODO
	}

	getValue() {
		const expr = []
		this.querySelectorAll("table.value tbody tr").forEach(tr =>
			expr.push(tr.expr))
		const defVal = this.value && this.value.defVal
		return { expr, defVal }
	}
}

customElements.define("msa-user-perm-editor", HTMLMsaUserPermEditorElement)


export class HTMLMsaUserPermNumEditorElement extends HTMLMsaUserPermEditorElement {

	connectedCallback() {
		if (this.hasAttribute("labels"))
			this.labels = this.getAttribute("labels").split(",")
		super.connectedCallback()
	}
	getDefaultPermUnitExpr() {
		return { group: "all", value: 0 }
	}
	initPermUnitPermActions(tr, permEl) {
		makeSuggestions(permEl, async el => this.labels, {
			waitTime: 0,
			fillTarget: (el, suggest) =>
				this.setPermUnitValue(tr, this.labels.indexOf(suggest))
		})
	}
	syncPermUnitValue(tr) {
		const val = tr.expr.value, labels = this.labels
		const prettyVal = labels ? labels[val] : val
		tr.querySelector(".perm").textContent = prettyVal
	}
	formatPerm(expr) {
		if (!isArr && typeof expr === "object") {
			if (expr.or) return "( " + expr.or.map(or => this.formatPerm(or)).join(" OR ") + " )"
			if (expr.and) return "( " + expr.and.map(and => this.formatPerm(and)).join(" AND ") + " )"
		}
		if (this.labels && typeof expr === "number") {
			return this.labels[expr]
		}
		return super.formatPerm(expr)
	}
	formatPermValue(val) {
		if (this.labels)
			return this.labels[val]
		return val
	}
}

customElements.define("msa-user-perm-num-editor", HTMLMsaUserPermNumEditorElement)