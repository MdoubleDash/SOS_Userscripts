// ==UserScript==
// @name RemoveRM_Flair
// @namespace https://github.com/MdoubleDash
// @version 1.0
// @description Removes the recognized member text from RM's flair
// @author MDoubleDash
// @match *://*.stackoverflow.com/questions/*
// @downloadURL https://github.com/MdoubleDash/Remove_RM_Flair/edit/main/Remove RM Flair.user.js
// @updateURL   https://github.com/MdoubleDash/Remove_RM_Flair/edit/main/Remove RM Flair.user.js
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    var elements = document.getElementsByClassName("s-user-card--type affiliate-badge px8 pb8 mtn4 fs-caption");
    while (elements.length > 0) elements[0].remove();
  
})();
