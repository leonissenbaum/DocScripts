// ==UserScript==
// @name         Doc: View Trades
// @namespace    https://politicsandwar.com/nation/id=19818
// @version      1.2
// @description  Make Trading on the market Better!
// @author       BlackAsLight
// @match        https://politicsandwar.com/index.php?id=26*
// @match        https://politicsandwar.com/index.php?id=90*
// @match        https://politicsandwar.com/nation/trade/
// @grant        none
// ==/UserScript==

'use strict';
const sellColor = '#5cb85c';
const buyColor = '#337ab7';

const resources = (() => {
	const resources = document.getElementById('rssBar').children[0].children[0].children[0].innerText.trim().replaceAll('  ', ' ').replaceAll(',', '').split(' ');
	return {
		money: parseFloat(resources[13]),
		oil: parseFloat(resources[2]),
		coal: parseFloat(resources[1]),
		iron: parseFloat(resources[5]),
		bauxite: parseFloat(resources[6]),
		lead: parseFloat(resources[4]),
		uranium: parseFloat(resources[3]),
		food: parseFloat(resources[11]),
		gasoline: parseFloat(resources[7]),
		steel: parseFloat(resources[9]),
		aluminum: parseFloat(resources[10]),
		munitions: parseFloat(resources[8]),
		credits: parseFloat(resources[0])
	};
})();

{
	let trTags = document.getElementsByClassName('nationtable')[0].children[0].children;
	for (let i = 1; i < trTags.length; i++) {
		AffectRow(trTags[i].children);
	}
}

(async () => {
	const isNationDisplay = (() => {
		if (window.location.pathname == '/nation/trade/') {
			return true;
		}
		const args = window.location.search.split('&');
		while (args.length) {
			let arg = args.shift().split('=');
			if (arg[0] == 'display') {
				if (arg[1] == 'alliance' || arg[1] == 'world') {
					return false;
				}
				return true;
			}
		}
		return true;
	})();

	if (!isNationDisplay) {
		let ulTag = document.createElement('ul');
		ulTag.innerHTML = `Load All Offers: <input id ="loadOffers" type="checkbox" ${localStorage.Doc_LoadAllOffers == 'true' ? 'checked' : ''}>`;
		document.getElementById('leftcolumn').appendChild(ulTag);
		document.getElementById('loadOffers').onchange = () => {
			console.log('potatocake');
			let inputTag = document.getElementById('loadOffers');
			if (inputTag.checked) {
				localStorage.Doc_LoadAllOffers = true;
			}
			else {
				localStorage.Doc_LoadAllOffers = false;
			}
		};
	}

	if (!isNationDisplay && localStorage.Doc_LoadAllOffers == 'true') {
		const maximumOffers = (() => {
			const args = window.location.search.split('&');
			while (args.length) {
				let arg = args.shift().split('=');
				if (arg[0] == 'maximum') {
					return parseInt(arg[1]);
				}
			}
			return 50;
		})();

		const pagesToLoad = (() => {
			const totalOffers = (() => {
				let tags = document.getElementsByClassName('center');
				let pTags = [];
				for (let i = 0; i < tags.length; i++) {
					if (tags[i].tagName == 'P') {
						pTags.push(tags[i]);
					}
				}

				pTags[2].appendChild(pTags[3].children[4]);

				let text = pTags[4].textContent.split(' ');
				text.splice(1, 2);
				pTags[4].innerText = text.join(' ');

				pTags[5].parentElement.removeChild(pTags[5]);

				if (maximumOffers < 50) {
					pTags[3].innerHTML = `Note: The game just tried to only load ${maximumOffers} trade offers.`
						+ '<br>We strongly recommend going to your <a target="_blank" href="https://politicsandwar.com/account/#4">Account</a> settings and changing the default search results to 50,'
						+ '<br>or if this was a link provided by some bot, that you ask the maximum query in the link be set to at least 50, preferably 100.';
				}
				else {
					pTags[3].parentElement.removeChild(pTags[3]);
				}

				return parseInt(text[1]);
			})();
			if (totalOffers > maximumOffers) {
				let pages = Math.ceil((totalOffers - maximumOffers) / 100);
				if (pages > 0) {
					return pages;
				}
			}
			return 0;
		})();

		let tbodyTag = document.getElementsByClassName('nationtable')[0].children[0];
		for (let i = 0; i < pagesToLoad; i++) {
			let url = (() => {
				let args = window.location.href.split('&');
				let minFound = false;
				let maxFound = false;
				for (let j = 0; j < args.length; j++) {
					let arg = args[j].split('=');
					if (arg[0] == 'minimum') {
						minFound = true;
						arg[1] = 100 * i + maximumOffers;
						args[j] = arg.join('=');
					}
					else if (arg[0] == 'maximum') {
						maxFound = true;
						if (arg[1] != '100') {
							arg[1] = '100';
							args[j] = arg.join('=');
						}
					}
				}
				if (!maxFound) {
					args.push(`maximum=100`);
				}
				if (!minFound) {
					args.push(`minimum=${100 * i + maximumOffers}`);
				}
				return args.join('&');
			})();

			let doc = new DOMParser().parseFromString(await (await fetch(url)).text(), 'text/html');
			let rows = Array.from(doc.getElementsByClassName('nationtable')[0].children[0].children);
			rows.shift();
			while (rows.length) {
				let row = rows.shift();
				AffectRow(row.children);
				tbodyTag.appendChild(row);
			}
		}
	}
})();

function AffectRow(cells) {
	const resource = cells[4].children[0].getAttribute('title').toLowerCase();
	const quantity = parseInt(cells[4].innerText.trim().replaceAll(',', ''));
	const price = parseInt(cells[5].innerText.trim().split(' ')[0].replaceAll(',', ''));
	const isSellOffer = cells[1].childElementCount == 1;

	if (cells[6].children[0].tagName == 'FORM') {
		if (isSellOffer) {
			cells[6].children[0].children[5].style.backgroundColor = sellColor;
			if (quantity > resources[resource]) {
				cells[6].children[0].children[3].value = Math.floor(resources[resource]);
			}
		}
		else {
			cells[6].children[0].children[5].style.backgroundColor = buyColor;
			if (quantity * price > resources.money) {
				cells[6].children[0].children[3].value = Math.floor(resources.money / price);
			}
		}
		cells[5].children[2].innerText = '$' + (parseInt(cells[6].children[0].children[3].value) * price).toLocaleString();

		cells[5].appendChild(document.createElement('br'));
		let outbidLink = createLink(resource, price + (isSellOffer ? 1 : -1), isSellOffer);
		if (typeof outbidLink == 'string') {
			let aTag = document.createElement('a');
			aTag.innerText = 'Outbid';
			aTag.href = outbidLink;
			cells[5].appendChild(aTag);
		}
		let matchLink = createLink(resource, price, isSellOffer);
		if (typeof outbidLink == 'string' && typeof matchLink == 'string') {
			cells[5].append(' | ');
		}
		if (typeof matchLink == 'string') {
			let aTag = document.createElement('a');
			aTag.innerText = 'Match';
			aTag.href = matchLink;
			cells[5].appendChild(aTag);
		}
	}
	else if (cells[6].children[0].tagName == 'A') {
		let link = createLink(resource, price, isSellOffer, quantity);
		if (typeof link == 'string') {
			cells[5].appendChild(document.createElement('br'));
			let aTag = document.createElement('a');
			aTag.innerText = 'TopUp';
			aTag.href = link;
			cells[5].appendChild(aTag);
		}
	}
}

function createLink(resource, price, isSellOffer, subQuantity = 0) {
	let quantity;
	if (isSellOffer) {
		quantity = Math.floor(resources.money / price - subQuantity);
	}
	else {
		quantity = Math.floor(resources[resource] - subQuantity);
		if (resource == 'food') {
			quantity -= 5000;
		}
	}
	if (quantity > 1000000) {
		quantity = 1000000;
	}
	if (quantity <= 0) {
		return undefined;
	}
	return `https://politicsandwar.com/nation/trade/create/resource=${resource}?p=${price}&q=${quantity}&t=${isSellOffer ? 'b' : 's'}`;
}
