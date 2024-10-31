// ==UserScript==
// @name Hide Homepage Widgets
// @namespace https://github.com/MdoubleDash
// @version 1.0
// @description Removes the new widgets on Stack Overflow's homepage
// @author MDoubleDash (@M--)
// @contributor  @VLAZ
// @match https://stackoverflow.com/
// @downloadURL https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Hide%20Homepage%20Widgets.user.js
// @updateURL https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Hide%20Homepage%20Widgets.user.js
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    document.documentElement.insertAdjacentHTML('beforeend', '<style type="text/css" id="hide-new-homepage-elements"> .d-flex.flex__fl-shrink0.flex__center.g24.fw-wrap.overflow-hidden { display: none !important; }</style><style type="text/css" id="hide-new-homepage-elements"> .d-flex.fd-column.mb16 { display: none !important; }</style>')

})();
