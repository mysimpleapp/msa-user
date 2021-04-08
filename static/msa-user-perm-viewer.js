import { importHtml } from '/msa/utils/msa-utils.js'


importHtml(`<style>
	msa-user-perm-viewer, msa-user-perm-num-viewer {
		display: block;
	}
</style>`)


export class HTMLMsaUserPermViewerElement extends HTMLElement {

	setValue(val) {
		const exprVal = this.formatExpr(val.expr)
		const defVal = this.formatExprValue(val.defVal)
		let txt = exprVal
		if (txt && defVal) txt += "; else: "
		if (defVal) txt += defVal
		this.textContent = txt
	}

	formatExpr(expr) {
		if (isArr(expr))
			return expr.map(e => this.formatExpr(e)).join("; ")
		if (typeof expr === "object") {
			if (expr.user) return `${expr.user}: ${this.formatExprValue(expr.value)}`
			if (expr.group) return `${expr.group}: ${this.formatExprValue(expr.value)}`
		}
		return expr ? expr : ""
	}
	formatExprValue(val) {
		return val
	}
}
customElements.define("msa-user-perm-viewer", HTMLMsaUserPermViewerElement)


export class HTMLMsaUserPermNumViewerElement extends HTMLMsaUserPermViewerElement {

	connectedCallback() {
		if (this.hasAttribute("labels"))
			this.labels = this.getAttribute("labels").split(",")
	}

	formatExprValue(val) {
		if (this.labels)
			return this.labels[val]
		return val
	}
}
customElements.define("msa-user-perm-num-viewer", HTMLMsaUserPermNumViewerElement)


// utils

const isArr = Array.isArray