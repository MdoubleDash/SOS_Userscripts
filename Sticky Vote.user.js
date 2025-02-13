// ==UserScript==
// @name         Sticky Vote
// @namespace    https://github.com/MdoubleDash
// @version      0.1
// @description  Makes the score and voting buttons for a post move with the viewport
// @author       MDoubleDash (@M--)
// @contributor  @TylerH
// @match        *://*.stackoverflow.com/*
// @match        *://*.stackexchange.com/*
// @match        *://*.askubuntu.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.superuser.com/*
// @match        *://*.stackapps.com/*
// @downloadURL  https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Sticky%20Vote.user.js
// @updateURL    https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Sticky%20Vote.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const css = `
    /* Makes the score and voting buttons for a post move with the viewport */
    #answers .votecell .js-voting-container {
        position: sticky;
        top: 100px;
        z-index: 1;
    }
    /* Fixes the width of the tooltips which broke due to sticky positioning */
    div.js-voting-container button.js-vote-up-btn + div.s-popover[role="tooltip"] {
        min-width: 150px;
        text-align: center;
        padding: 11px;
    }
    div.js-voting-container button.js-vote-down-btn + div.s-popover[role="tooltip"] {
        min-width: 170px;
        text-align: center;
        padding: 11px;
    }
    .js-voting-container div.js-vote-count + div.s-popover[role="tooltip"] {
        min-width: 217px;
    }
    button.js-saves-btn + div.s-popover {
        min-width: 128px;
    }
    a.js-post-issue + div.s-popover {
        min-width: 140px;
    }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
})();
