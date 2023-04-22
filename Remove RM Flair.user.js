// ==UserScript==
// @name RemoveRM_Flair
// @namespace RM_Flair
// @match *://*.stackoverflow.com/questions/*
// @version 1
// @author MDoubleDash
// @description try to take over the world!
// @grant none
// ==/UserScript==

(function() {
'use strict';

var elements = document.getElementsByClassName("s-user-card--type affiliate-badge px8 pb8 mtn4 fs-caption");

while (elements.length > 0) elements[0].remove();
})();