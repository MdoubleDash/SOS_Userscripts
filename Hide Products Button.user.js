// ==UserScript==
// @name Remove Products Button
// @namespace https://github.com/MdoubleDash
// @version 1.0
// @description Removes the Products button from the top bar (especially useful for browsing on mobile devices)
// @author MDoubleDash (@M--)
// @match *://*.stackoverflow.com/*
// @downloadURL https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Hide%20Products%20Button.user.js
// @updateURL   https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Hide%20Products%20Button.user.js
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    document.documentElement.insertAdjacentHTML('beforeend', '<style type="text/css" id="hide-products-button"> .s-navigation.fw-nowrap { display: none; }</style>') 
  
})();
