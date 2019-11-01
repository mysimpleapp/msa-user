import { importHtml } from '/msa/msa.js'

// content

const content = `
	<p>
		<select class="type">
			<option value="all">ALL</option>
			<option value="name">Name</option>
			<option value="group">Group</option>
		</select>
		<input class="value"></input>
	</p>
	<p><button class="ok">OK</button></p>
`


// element

export class HTMLMsaUserSelectorElement extends HTMLElement {}
const MsaUserSelectorPt = HTMLMsaUserSelectorElement.prototype

MsaUserSelectorPt.connectedCallback = function(){
	this.initContent()
	this.syncContent()
	this.initActions()
}

MsaUserSelectorPt.setValue = function(val){
	for(let key in val){
		this.setTypeValue(val[key])
		this.setType(key)
	}
	this.syncType()
	this.syncTypeValue()
}

MsaUserSelectorPt.initContent = function(){
	this.innerHTML = content
}

MsaUserSelectorPt.initActions = function(){
	this.querySelector("select.type").addEventListener("change", evt =>
		this.setType(evt.target.value))
	this.querySelector("input.value").addEventListener("change", evt =>
		this.setTypeValue(evt.target.value))
	this.querySelector("button.ok").addEventListener("click", evt =>
		this.validate())
}

MsaUserSelectorPt.syncContent = function(name, oldVal, newVal){
	this.syncType()
	this.syncTypeValue()
}

MsaUserSelectorPt.setType = function(t){
	if(t === this.type) return
	this.type = t
	this.value = (t == "all") ? true : ""
	this.syncType()
	this.syncTypeValue()
}
MsaUserSelectorPt.syncType = function(){
	upd(this.querySelector("select.type"), "value", this.type)
}

MsaUserSelectorPt.setTypeValue = function(val){
	this.value = val
	this.syncTypeValue()
}
MsaUserSelectorPt.syncTypeValue = function(){
	const valEl = this.querySelector("input.value")
	upd(valEl, "value", this.value)
	valEl.style.display = (this.type==="all") ? "none" : ""
}

MsaUserSelectorPt.validate = function(){
	const detail = {}
	detail[this.type] = this.value
	const evt = new CustomEvent('validate', { 'detail': detail })
	this.dispatchEvent(evt)
}

// register elem
customElements.define("msa-user-selector", HTMLMsaUserSelectorElement)


// utils

function upd(obj, key, val){
	if(obj[key]!==val)
		obj[key] = val
}