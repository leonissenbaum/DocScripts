// ==UserScript==
// @name         Doc: Hide Alliance Descriptions
// @namespace    https://politicsandwar.com/nation/id=19818
// @version      0.1
// @description  Hides Alliances's Descriptions set up by their government. Why? Because some people like to make them excessively long.
// @author       BlackAsLight
// @match        https://politicsandwar.com/alliance/id=*
// @icon         https://avatars.githubusercontent.com/u/44320105
// @grant        none
// ==/UserScript==

'use strict';
const contTag = document.getElementsByClassName('ck-content')[0];

// Insert button to toggle between Show/Hide Alliance's Description.
contTag.parentElement.insertBefore((() => {
	const divTag = document.createElement('div');
	divTag.style.display = 'block';
	divTag.style.paddingBottom = '1em';
	divTag.style.textAlign = 'center';
	divTag.appendChild((() => {
		const buttonTag = document.createElement('button');
		buttonTag.id = 'Doc_Button';
		buttonTag.style.backgroundColor = '#337AB7';
		buttonTag.style.color = '#FFFFFF';
		buttonTag.style.padding = '1em';
		buttonTag.style.borderRadius = '6px';
		buttonTag.innerText = 'Hide Description!';
		buttonTag.onclick = buttonClick;
		return buttonTag;
	})());
	return divTag;
})(), contTag);

// Insert second button to Hide Alliance's Description.
contTag.appendChild((() => {
	const divTag = document.createElement('div');
	divTag.style.paddingBottom = '1em';
	divTag.style.textAlign = 'center';
	divTag.appendChild((() => {
		const buttonTag = document.createElement('button');
		buttonTag.style.backgroundColor = '#337AB7';
		buttonTag.style.color = '#FFFFFF';
		buttonTag.style.padding = '1em';
		buttonTag.style.borderRadius = '6px';
		buttonTag.innerText = 'Hide Description!';
		buttonTag.onclick = buttonClick;
		return buttonTag;
	})());
	return divTag;
})());

// Function to Switch between Displaying and Hiding the Nation's Description.
function buttonClick() {
	if (contTag.style.display == 'none') {
		document.getElementById('Doc_Button').innerText = 'Hide Description!';
		contTag.style.display = '';
	}
	else {
		document.getElementById('Doc_Button').innerText = 'Show Description!';
		contTag.style.display = 'none';
	}
}