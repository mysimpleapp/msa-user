import { ajax } from '/msa/utils/msa-utils.js'

export function getUser() {
	if (window.MsaUserPrm === undefined)
		window.MsaUserPrm = ajax("GET", "/msa/user/user")
	return window.MsaUserPrm
}