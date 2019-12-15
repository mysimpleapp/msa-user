import { Q, ajax, importHtml, importOnCall } from "/utils/msa-utils.js"

const makeSuggestions = importOnCall("/utils/msa-utils-suggest.js", "makeSuggestions")

// style

importHtml(`<style>
	msa-user-selector .row {
		display: flex;
		flex-direction: row;
	}
	msa-user-selector .col {
		display: flex;
		flex-direction: column;
	}
	msa-user-selector .center {
		align-items:center
	}
	msa-user-selector input.value {
		width: 200px;
	}
	msa-user-selector img.icon {
		width: 1em;
		height: 1em;
	}
</style>`)

// template

const template = `
	<div class="row center" style="margin-bottom:.5em">
		<div style="margin-right:.5em">Search for</div>
		<div class="col">
			<div class="row center">
				<input type="checkbox" class="users" checked />
				<img class="icon" src="/user/img/user" />
				<div>Users</div>
			</div>
			<div class="row center">
				<input type="checkbox" class="groups" checked />
				<img class="icon" src="/user/img/group" />
				<div>Groups</div>
			</div>
		</div>
	</div><div>
		<input type="text" class="value" placeholder="Search..."></input></br>
	</div>`

const suggestionTemplate = `
	<div style="display:flex; flex-direction:row; align-items:center">
		<img class="icon" style="width:1em; height:1em; padding:0; margin-right:.2em"/>
		<div class="text"></div>
	</div>`

// msa-user-selector

export class HTMLMsaUserSelectorElement extends HTMLElement {

	connectedCallback(){
		this.Q = Q
		this.innerHTML = this.getTemplate()
//		this.syncContent()
		this.initActions()
	}

	setValue(val){
		for(let key in val){
			this.setTypeValue(val[key])
			this.setType(key)
		}
		this.syncType()
		this.syncTypeValue()
	}

	getTemplate(){
		return template
	}

	initActions(){
		this.listenForSuggestions()
	}

	search(text){
		const types = []
		if(this.Q("input.users").checked) types.push("user")
		if(this.Q("input.groups").checked) types.push("group")
		return ajax("GET", "/user/search", {
			query: { text, types }
		})
	}

	listenForSuggestions(){
		makeSuggestions(this.Q("input.value"), async el => {
			const res = await this.search(el.value)
			return res.results
		}, {
			formatSuggestion: suggest => {
				let imgSrc
				if(suggest.type === "user") imgSrc = "/user/img/user"
				else if(suggest.type === "group") imgSrc = "/user/img/group"
				const tmpl = document.createElement("template")
				tmpl.innerHTML = suggestionTemplate
				const res = tmpl.content.children[0]
				res.querySelector(".icon").src = imgSrc
				res.querySelector(".text").textContent = suggest.name
				return res
			},
			fillTarget: (el, suggest) => {
				el.value = suggest.name
				this.value = suggest
			}
		})
	}

	syncContent(){
		this.syncType()
		this.syncTypeValue()
	}

	setType(t){
		if(t === this.type) return
		this.type = t
		this.value = (t == "all") ? true : ""
		this.syncType()
		this.syncTypeValue()
	}
	syncType(){
		upd(this.querySelector("select.type"), "value", this.type)
	}

	setTypeValue(val){
		this.value = val
		this.syncTypeValue()
	}
	syncTypeValue(){
		const valEl = this.querySelector("input.value")
		upd(valEl, "value", this.value)
		valEl.style.display = (this.type==="all") ? "none" : ""
	}

	validate(){
		const detail = {}
		detail[this.type] = this.value
		const evt = new CustomEvent('validate', { 'detail': detail })
		this.dispatchEvent(evt)
	}

	focus(){
		this.Q("input.value").focus()
	}
}
customElements.define("msa-user-selector", HTMLMsaUserSelectorElement)

// utils

function upd(obj, key, val){
	if(obj[key]!==val)
		obj[key] = val
}