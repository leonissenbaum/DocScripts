// ==UserScript==
// @name         Doc: Find War
// @namespace    https://politicsandwar.com/nation/id=19818
// @version      1.9
// @description  Consolidates information about potential raiding targets.
// @author       BlackAsLight
// @match        https://politicsandwar.com/index.php?id=15*
// @match        https://politicsandwar.com/nations/
// @icon         https://avatars.githubusercontent.com/u/44320105
// @grant        GM_xmlhttpRequest
// ==/UserScript==

'use strict';
/* Double Injection Protection
-------------------------*/
if (document.querySelector('#Doc_FindWar')) {
	return;
}
document.body.append(CreateElement('div', divTag => {
	divTag.id = 'Doc_FindWar';
	divTag.style.display = 'none';
}));

function CreateElement(type, func) {
	const tag = document.createElement(type);
	func(tag);
	return tag;
}

// Global Variables.
const char = [
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

let idCache = [];

// Delete Google URL from memory if present from previous versions.
if (localStorage.Doc_FindWarURL != 'undefined') {
	localStorage.removeItem('Doc_FindWarURL');
}

// Handle obtaining, changing and saving the API Key, provided by user, to access the game's APIs.
(() => {
	let codeTag = document.createElement('code');
	codeTag.innerHTML = localStorage.Doc_APIKey == 'undefined' || localStorage.Doc_APIKey == '' ? '<button>Insert API Key</button>' : '<button>Update API Key</button>';
	codeTag.onclick = () => {
		const response = prompt('Insert API Key which can be found at the bottom of Accounts Page:', localStorage.Doc_APIKey);
		if (response != undefined) {
			if (response.length) {
				localStorage.Doc_APIKey = response;
			}
			else {
				localStorage.removeItem('Doc_APIKey');
			}
			location.reload();
		}
	};
	document.getElementById('leftcolumn').appendChild(codeTag);
})();

// Creates CSS class.
{
	let styleTag = document.createElement('style');
	styleTag.textContent = '.grid-container-three {display:grid; grid-template-columns: calc(100%/3) calc(100%/3) calc(100%/3);} .grid-container-six {display:grid; grid-template-columns: calc(100%/6) calc(100%/6) calc(100%/6) calc(100%/6) calc(100%/6) calc(100%/6);} .grid-item {text-align: center;}';
	document.head.appendChild(styleTag);
}

// Creates a boolean value about whether it should alter the page.
const run = (() => {
	if (localStorage.Doc_APIKey != undefined) {
		let args = location.search.slice(1).split('&');
		while (args.length) {
			let arg = args.shift().split('=');
			if (arg[0] == 'cat') {
				if (arg[1] == 'war_range') {
					return true;
				}
			}
		}
	}
	return false;
})();

// Iterates through every row in the table.
if (run) {
	let trTags = Array.from(document.getElementsByClassName('nationtable')[0].children[0].children);

	// Update the header row of the table.
	{
		let thTags = Array.from(trTags.shift().children);
		let thTag = thTags.shift();
		thTag.innerText = 'Targets?';

		// Delete excess cells in table.
		while (thTags.length) {
			thTag = thTags.shift();
			thTag.parentElement.removeChild(thTag);
		}
	}

	// Update the rest of the rows in the table.
	while (trTags.length) {
		AffectRow(trTags.shift());
	}

	// Deal with idCache...
	let nationIDs = [];
	for (let i = 0; i < idCache.length; i++) {
		nationIDs.push(idCache[i].nationID);
	}
	GetNations(nationIDs).then(x => UpdateTable(x));
}

// Alters a row to meet the new template.
function AffectRow(trTag) {
	let tdTags = Array.from(trTag.children);
	let tdTag = tdTags.shift();

	const militaryID = RandomID();
	const continentID = RandomID();
	const lastActiveID = RandomID();
	const warHistoryID = RandomID();
	tdTag.innerHTML = RowTemplate(tdTags, militaryID, continentID, lastActiveID, warHistoryID);
	// Load Military OnClick Event
	let nationID = tdTags[0].children[0].href.split('=')[1];
	idCache.push({
		militaryID: militaryID,
		continentID: continentID,
		lastActiveID: lastActiveID,
		warHistoryID: warHistoryID,
		nationID: nationID
	});

	// Delete excess cells in table.
	while (tdTags.length) {
		tdTag = tdTags.shift();
		tdTag.parentElement.removeChild(tdTag);
	}
}

// Creates the new Row HTML as a string.
function RowTemplate(tdTags, militaryID, continentID, lastActiveID, warHistoryID) {
	let html = '';
	// First Container
	html += '<div class="grid-container-three">';
	html += GridItem('<i>Continent</i>', continentID); // Continent
	html += GridItem(tdTags[0].innerText.split('\n')[1] + (tdTags[5].children[0] == undefined || tdTags[5].children[0].title.endsWith('Range') || tdTags[5].children[2] == undefined ? '' : ` <a target="_blank" href="https://politicsandwar.com/nation/war/declare/id=${tdTags[0].children[0].href.split('id=')[1]}"><img src="https://politicsandwar.com/img/icons/16/sword.png"></a>`)); // Leader Name
	html += GridItem(`<img src="${tdTags[3].children[0].src}">`); // Nation Colour
	html += GridItem('<i>Last Active</i>', lastActiveID); // Last Active
	html += GridItem(`<a target="_blank" href="${tdTags[0].children[0].href}">${tdTags[0].children[0].textContent.trim()}</a>`); // Nation Name
	html += GridItem(`Founded: ${FormatDate(new Date(tdTags[1].textContent.split(' ')[0]))}`); // Founded
	html += GridItem(`Cities: ${tdTags[4].textContent}`); // Cities
	html += GridItem(`${tdTags[2].children[0] == undefined ? 'None' : `<a target="_blank" href="${tdTags[2].children[0].href}">${tdTags[2].children[0].textContent}</a>`}`); // Alliance Name
	html += GridItem(`Score: ${tdTags[5].textContent.trim()}`); // Score
	html += '</div>';
	// Title
	html += `<hr><h4 style="text-align:center;">${tdTags[5].children[2] == undefined ? '' : `<img src="${tdTags[5].children[2].src}"> `}Military${tdTags[5].children[1] == undefined ? (tdTags[5].children[0] != undefined && tdTags[5].children[0].title.endsWith('Spy Range') ? ` <img src="${tdTags[5].children[0].src}">` : '') : ` <img src="${tdTags[5].children[1].src}">`}</h4>`;
	// Second Container
	html += `<div id="${militaryID}" class="grid-container-six">`;
	html += GridItem('<i>Soldiers</i>');
	html += GridItem('<i>Tanks</i>');
	html += GridItem('<i>Planes</i>');
	html += GridItem('<i>Ships</i>');
	html += GridItem('<i>Missiles</i>');
	html += GridItem('<i>Nukes</i>');
	html += '</div>'
	// Title
	html += `<hr><h4 style="text-align:center;">War History${tdTags[5].children[0] == undefined ? '' : (() => { let src = tdTags[5].children[0].src; let repeat = parseInt(tdTags[5].children[0].title.split(' ')[0]); let imgTags = ''; for (let i = 0; i < repeat; i++) { imgTags += ` <img src="${src}">`; } return imgTags; })()}</h4>`;
	html += `<div style="text-align: center;" id="${warHistoryID}"><i>Loading...</i></div>`;
	return html;
}

function GridItem(text, id) {
	if (id == undefined) {
		return '<div class="grid-item">' + text + '</div>';
	}
	return '<div id="' + id + '" class="grid-item">' + text + '</div>';
}

// Send a GET request.
async function GetNations(nationIDs) {
	return JSON.parse(await (await fetch(`https://api.politicsandwar.com/graphql?api_key=${localStorage.getItem('Doc_APIKey')}&query={ nations(first: 50, id: [${nationIDs.join(', ')}]) { data { id leader_name continent last_active soldiers tanks aircraft ships missiles nukes treasures { name color continent bonus spawndate } offensive_wars { id date war_type winner attacker { id nation_name leader_name alliance { id name }} defender { id nation_name leader_name alliance { id name }} attacks { type loot_info }} defensive_wars { id date war_type winner attacker { id nation_name leader_name alliance { id name }} defender { id nation_name leader_name alliance { id name } } attacks { type loot_info }}}}}`)).text()).data.nations.data
}

// Deal with the response of a GET Request.
function UpdateTable(jsonData) {
	while (jsonData.length) {
		let api = jsonData.shift();
		for (let i = 0; i < idCache.length; i++) {
			if (idCache[i].nationID == api.id) {
				let object = idCache.splice(i, 1).shift();
				try {
					UpdateTargetInfo(api, object.militaryID, object.continentID, object.lastActiveID, object.warHistoryID);
				}
				catch (e) {
					console.log(e);
				}
				break;
			}
		}
	}
	idCache = undefined;
}

// Fills in Military info.
function UpdateTargetInfo(api, militaryID, continentID, lastActiveID, warHistoryID) {
	// Fill in Military Data.
	let gridItemTags = Array.from(document.getElementById(militaryID).children);
	gridItemTags[0].innerText = 'Solders: ' + parseInt(api.soldiers).toLocaleString();
	gridItemTags[1].innerText = 'Tanks: ' + parseInt(api.tanks).toLocaleString();
	gridItemTags[2].innerText = 'Planes: ' + parseInt(api.aircraft).toLocaleString();
	gridItemTags[3].innerText = 'Ships: ' + parseInt(api.ships).toLocaleString();
	gridItemTags[4].innerText = 'Missiles: ' + parseInt(api.missiles).toLocaleString();
	gridItemTags[5].innerText = 'Nukes: ' + parseInt(api.nukes).toLocaleString();

	// Fill in Continent.
	switch (api.continent) {
		case 'af':
			document.getElementById(continentID).innerText = 'Africa';
			break;
		case 'an':
			document.getElementById(continentID).innerText = 'Antarctica';
			break;
		case 'as':
			document.getElementById(continentID).innerText = 'Asia';
			break;
		case 'au':
			document.getElementById(continentID).innerText = 'Australia';
			break;
		case 'eu':
			document.getElementById(continentID).innerText = 'Europe';
			break;
		case 'na':
			document.getElementById(continentID).innerText = 'North America';
			break;
		case 'sa':
			document.getElementById(continentID).innerText = 'South America';
			break;
		default:
			document.getElementById(continentID).innerText = api.continent;
			break;
	}

	// Fill in Last Active.
	document.getElementById(lastActiveID).innerText = 'Last Active: ' + FormatDateTime(new Date(api.last_active));

	// Fill in War History.
	let wars = api.offensive_wars.concat(api.defensive_wars);
	let html = '';
	if (wars.length) {
		wars = wars.sort((x, y) => x.date < y.date);
		let count = 0;
		while (wars.length && count < 3) {
			let war = wars.shift();
			if (war.winner != '0') {
				count++;
				const opponentLost = war.winner == api.id;
				const opponentIsDefender = war.attacker.id == api.id;
				const victory = war.attacks.filter(x => x.type == 'VICTORY').shift().loot_info.replaceAll('\r\n', '').split('won the war and looted')[1].split('Food.')[0].trim().split(' ').filter(x => x.length);
				//console.log(victory);
				html += `<p${count == 1 ? ' style="background: #85E085;"' : ''}>`
					+ `<b>${war.war_type}</b>`
					+ ` | <img src="${opponentLost ? 'https://politicsandwar.com/img/icons/16/medal_award_gold.png' : 'https://politicsandwar.com/img/icons/16/emotion_dead.png'}">`
					+ ` ${api.leader_name}`
					+ ` ${opponentLost ? 'Won' : 'Lost'}`
					+ ` against ${opponentIsDefender ? war.defender.leader_name : war.attacker.leader_name}`
					+ ` of <a target="_blank" href="https://politicsandwar.com/nation/id=${opponentIsDefender ? war.defender.id : war.attacker.id}">${opponentIsDefender ? war.defender.nation_name : war.attacker.nation_name}</a>`
					+ (war.attacker.alliance == null || war.defender.alliance == null ? '' : ` from <a target="_blank" href="https://politicsandwar.com/alliance/id=${opponentIsDefender ? war.defender.alliance.id : war.attacker.alliance.id}">${opponentIsDefender ? war.defender.alliance.name : war.attacker.alliance.name}</a>`)
					+ ` | <i><a target="_blank" href="https://politicsandwar.com/nation/war/timeline/war=${war.id}">War Timeline</a></i> | ${FormatDate(new Date(war.date.replace(' ', 'T') + 'Z'))}`
					+ `<br><b>Loot</b>: ${victory[0].slice(0, victory[0].length - 1)}`
					+ ` <img src="https://politicsandwar.com/img/resources/oil.png"> ${victory[3]}`
					+ ` <img src="https://politicsandwar.com/img/resources/coal.png"> ${victory[1]}`
					+ ` <img src="https://politicsandwar.com/img/resources/iron.png"> ${victory[7]}`
					+ ` <img src="https://politicsandwar.com/img/resources/bauxite.png"> ${victory[9]}`
					+ ` <img src="https://politicsandwar.com/img/resources/lead.png"> ${victory[11]}`
					+ ` <img src="https://politicsandwar.com/img/resources/uranium.png"> ${victory[5]}`
					+ ` <img src="https://politicsandwar.com/img/icons/16/steak_meat.png"> ${victory[22]}`
					+ ` <img src="https://politicsandwar.com/img/resources/gasoline.png"> ${victory[13]}`
					+ ` <img src="https://politicsandwar.com/img/resources/steel.png"> ${victory[17]}`
					+ ` <img src="https://politicsandwar.com/img/resources/aluminum.png"> ${victory[19]}`
					+ ` <img src="https://politicsandwar.com/img/resources/munitions.png"> ${victory[15]}`
					+ `</p>`;
			}
		}
	}
	document.getElementById(warHistoryID).innerHTML = (html.length ? html : `<p">No War History</p>`);
}

function RandomID() {
	let id = '';
	for (let i = 0; i < 50; i++) {
		id += char[Math.floor(Math.random() * char.length)];
	}
	return id;
}

function FormatDateTime(date) {
	let text = '';
	if (date.getHours() < 10) {
		text += '0';
	}
	text += date.getHours() + ':';
	if (date.getMinutes() < 10) {
		text += '0';
	}
	text += date.getMinutes() + ' ';
	text += FormatDate(date);
	return text;
}

function FormatDate(date) {
	let text = '';
	if (date.getDate() < 10) {
		text += '0';
	}
	text += date.getDate() + '/';
	text += ['Jan', 'Feb', 'Mar', 'Api', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()] + '/';
	text += date.getFullYear();
	return text;
}
