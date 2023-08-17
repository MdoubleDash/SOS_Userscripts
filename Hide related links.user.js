// ==UserScript==
// @name Hide related links
// @namespace https://github.com/MdoubleDash
// @version 1.1
// @description Removes the recognized member text from RM's flair
// @author MDoubleDash (@M--)
// @match *://*.stackoverflow.com/questions/*
// @downloadURL https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Hide%20Related%20Links.user.js
// @updateURL   https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Hide%20Related%20Links.user.js
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    document.documentElement.insertAdjacentHTML('beforeend', '<style type="text/css" id="my-hide-related-sidebar"> .sidebar-related { display: none; }</style>')

})();
