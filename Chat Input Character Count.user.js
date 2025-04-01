// ==UserScript==
// @name         Chat Input Character Count
// @namespace    https://github.com/MdoubleDash
// @version      0.6
// @description  Adds a character count to Chat's textarea input
// @author       MDoubleDash (@M--)
// @match        https://chat.stackoverflow.com/*
// @match        https://chat.stackexchange.com/*
// @match        https://chat.meta.stackexchange.com/*
// @downloadURL  https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Chat%20Input%20Character%20Count.user.js
// @updateURL    https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Chat%20Input%20Character%20Count.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';
    const ChatLength = 500; // Hard-coded

    // device preference
    let devicePreference = GM_getValue('device_type');

    // check if the preference exists, if not, ask user
    if (devicePreference === undefined) {
        // Ask the user for their preference
        let response = prompt("Are you using this script on a phone? (Enter 'y' or 'n')");
        GM_setValue('device_type', response.toLowerCase().charAt(0));
        devicePreference = response.toLowerCase().charAt(0);
    }


    function addCharacterCount() {
        const textarea = document.getElementById('input');

        // style
        const charCountCell = document.createElement('td');
        charCountCell.id = 'char-count-cell';
        charCountCell.style.textAlign = 'right';
        charCountCell.style.paddingRight = '10px';
        charCountCell.style.color = 'gray';

        const charCountText = document.createElement('span');
        charCountText.id = 'char-count-text';
        charCountCell.appendChild(charCountText);

        // Add before text area on Phone
        if (devicePreference === 'y') {
            textarea.before(charCountText);
        } else {
            // Add besides the button area on PC
            const buttonArea = document.getElementById('chat-buttons');
            buttonArea.appendChild(charCountCell);
        }

        function updateCharacterCount() {
            const maxLength = ChatLength;
            const currentLength = textarea.value.length;
            const charsLeft = maxLength - currentLength;

            charCountText.textContent = charsLeft + ' chars left';

            if (charsLeft <= 0) {
                charCountCell.style.color = 'red';
            } else if (charsLeft < 50) {
                charCountCell.style.color = 'orange';
            } else {
                charCountCell.style.color = 'gray';
            }
        }

        textarea.addEventListener('input', updateCharacterCount);
        updateCharacterCount();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addCharacterCount);
    } else {
        addCharacterCount();
    }
})();
