// template

const template = `
	<p>
		<select class="type">
			<option value="all">ALL</option>
			<option value="name">Name</option>
			<option value="group">Group</option>
		</select>
		<input class="value"></input>
	</p>
	<p><button class="ok">OK</button></p>`

// msa-user-selector

export class HTMLMsaUserSelectorElement extends HTMLElement {

	connectedCallback(){
		this.innerHTML = this.getTemplate()
		this.syncContent()
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
		this.querySelector("select.type").addEventListener("change", evt =>
			this.setType(evt.target.value))
		this.querySelector("input.value").addEventListener("change", evt =>
			this.setTypeValue(evt.target.value))
		this.querySelector("button.ok").addEventListener("click", evt =>
			this.validate())
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
}
customElements.define("msa-user-selector", HTMLMsaUserSelectorElement)

// utils

function upd(obj, key, val){
	if(obj[key]!==val)
		obj[key] = val
}