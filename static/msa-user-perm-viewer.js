import { importHtml } from '/utils/msa-utils.js'


importHtml(`<style>
	msa-user-perm-viewer, msa-user-perm-num-viewer {
		display: block;
	}
</style>`)


export class HTMLMsaUserPermViewerElement extends HTMLElement {

	setValue(val){
		this.textContent = this.formatExpr(val)
    }

	formatExpr(expr){
		if(isArr(expr))
			return expr.map(e => this.formatExpr(e)).join("; ")
		if(typeof expr === "object") {
			if(expr.user) return `${expr.user}: ${this.formatExprValue(expr.value)}`
			if(expr.group) return `${expr.group}: ${this.formatExprValue(expr.value)}`
		}
		return expr ? expr : ""
	}
	formatExprValue(val){
		return val
	}
}
customElements.define("msa-user-perm-viewer", HTMLMsaUserPermViewerElement)


export class HTMLMsaUserPermNumViewerElement extends HTMLMsaUserPermViewerElement {

	connectedCallback(){
		if(this.hasAttribute("labels"))
			this.labels = this.getAttribute("labels").split(",")
	}

	formatExprValue(val){
		if(this.labels)
			return this.labels[val]
		return val
	}
}
customElements.define("msa-user-perm-num-viewer", HTMLMsaUserPermNumViewerElement)


// utils

const isArr = Array.isArray