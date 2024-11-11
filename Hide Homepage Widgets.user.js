// ==UserScript==
// @name Hide Homepage Widgets
// @namespace https://github.com/MdoubleDash
// @version 2.1.1
// @description Removes the new widgets on Stack Overflow's homepage
// @author @canon, MDoubleDash (@M--)
// @contributor @VLAZ
// @match https://stackoverflow.com/
// @downloadURL https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Hide%20Homepage%20Widgets.user.js
// @updateURL https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Hide%20Homepage%20Widgets.user.js
// @grant none
// ==/UserScript==

// (https://meta.stackoverflow.com/a/432018)
(function() {
  const widgetsContainer = document.getElementById("widgets-container");
  const blogWidget = document.querySelector('.s-sidebarwidget:has(a[href^="https://stackoverflow.blog/"]');
  const welcomeMessage = document.querySelector('.d-flex.g8');
  const postsMessage = document.querySelector('.d-flex.fd-column.mb16');

  if (!(widgetsContainer)) return;
  //const widgetsContainerItems = widgetsContainer.querySelectorAll(".s-card.grid--item.p16.d-flex.fd-column.g12");
  //const [tagWidget,tagModal] = widgetsContainerItems[2].children;
  //const [tagHeader,tagContent] = tagWidget.children;

  //blogWidget.before(tagWidget, tagModal);
  widgetsContainer.remove();

  $('.d-flex.fd-column.mb16').find(".fs-title.fw-bold").text("Suggested posts for you");
  postsMessage.remove();
  welcomeMessage.before(postsMessage);
  welcomeMessage.remove();


  // fix display by borrowing class salad from adjacent sidebar widget...
  // tagWidget.className = "s-sidebarwidget s-anchors s-anchors__grayscale mb16 p16";
  // tagHeader.className = "d-flex fc-black-600 pt16 pl16 fs-body2 fw-bold";
  // tagContent.className = "s-sidebarwidget--item d-flex px16";
 

})();
