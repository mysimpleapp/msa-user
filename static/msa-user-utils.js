import { ajax } from '/utils/msa-utils.js'

export function getUser() {
	if (window.MsaUserPrm === undefined)
		window.MsaUserPrm = ajax("GET", "/user/user")
	return window.MsaUserPrm
}