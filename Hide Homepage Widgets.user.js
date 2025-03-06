// ==UserScript==
// @name Hide Homepage Widgets
// @namespace https://github.com/MdoubleDash
// @version 2.5
// @description Removes the new widgets on Stack Overflow's homepage
// @author MDoubleDash (@M--), @canon
// @contributor PurpleMagick (@VLAZ), tentonaxe (@KevinB)
// @match https://stackoverflow.com/
// @downloadURL https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Hide%20Homepage%20Widgets.user.js
// @updateURL https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Hide%20Homepage%20Widgets.user.js
// @grant none
// ==/UserScript==

// (https://meta.stackoverflow.com/a/432018)
(function() {
  // get the widgets container and other elements
  const widgetsContainer = document.getElementById("widgets-container");
  if (!(widgetsContainer)) return;

  const blogWidget = document.querySelector('.s-sidebarwidget:has(a[href^="https://stackoverflow.blog/"]');
  const welcomeMessage = document.querySelector('.d-flex.g8');
  const postsMessage = document.querySelector('.d-flex.fd-column.mb16');

  // get the items in the widgets container
  const widgetsContainerItems = widgetsContainer.querySelectorAll(".s-card.grid--item");
  const tagWidget = widgetsContainerItems[2];

  // add a CSS class to hide all widgets inside widgetsContainer except for the "Watched tags" widget
  const style = document.createElement('style');
  style.innerHTML = `
    #widgets-container .s-card.grid--item:not(:nth-child(3)) {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // move the watched tag widget to the right sidebar
  blogWidget.before(tagWidget);

  // remove the welcome message and modify the "interesting posts"
  $('.d-flex.fd-column.mb16').find(".fs-title.fw-bold").text("Suggested posts for you");
  postsMessage.remove();
  welcomeMessage.before(postsMessage);
  welcomeMessage.remove();

  // fix display by borrowing class salad from adjacent sidebar widget...
  tagWidget.className = "s-sidebarwidget s-anchors s-anchors__grayscale mb16 p16";
  const tagHeader = tagWidget.querySelector(".d-flex.fc-black-600.pt16.pl16.fs-body2.fw-bold");
  const tagContent = tagWidget.querySelector(".s-sidebarwidget--item.d-flex.px16");
  tagHeader.className = "d-flex fc-black-600 pt16 pl16 fs-body2 fw-bold";
  tagContent.className = "s-sidebarwidget--item d-flex px16";

})();
