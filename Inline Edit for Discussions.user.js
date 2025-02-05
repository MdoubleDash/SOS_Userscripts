     // ==UserScript==
     // @name         Inline Edit for Discussions
     // @namespace    https://github.com/MdoubleDash
     // @version      0.1
     // @description  Adds an "inline edit" button beside the share button under each post and reply
     // @author       MDoubleDash (@M--)
     // @match        https://stackoverflow.com/beta/discussions/*
     // @match        https://stackoverflow.com/posts/*/edit-inline
     // @downloadURL  https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Inline%20Edit%20for%20Discussions.user.js
     // @updateURL    https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Inline%20Edit%20for%20Discussions.user.js
     // @grant        none
     // ==/UserScript==

     (function() {
     'use strict';

     // Inline Edit page tweaks
     document.documentElement.insertAdjacentHTML('beforeend', '<style type="text/css" id="screen-reader"> .js-stacks-editor-container { display: none; }</style>')
     document.documentElement.insertAdjacentHTML('beforeend', '<style type="text/css" id="screen-reader"> .flex--item.pt8 { display: none; }</style>')
     document.documentElement.insertAdjacentHTML('beforeend', '<style type="text/css" id="screen-reader"> .d-none.js-stacks-editor-backing-textarea { width:650px; height:300px }</style>')

     // Function to create the inline edit button
     function createInlineEditButton(postId) {
          const button = document.createElement('button');
          button.textContent = 'Inline-Edit';
          button.className = 's-btn s-btn__link fc-black-400'; // Match the style of existing buttons
          button.style.marginLeft = '10px';
          button.onclick = function() {
               window.location.href = `https://stackoverflow.com/posts/${postId}/edit-inline`;
          };
          return button;
     }

     // Function to extract the post ID from an element
     function extractPostId(element) {
          const postIdMatch = element.id.match(/\d+/);
          return postIdMatch ? postIdMatch[0] : null;
     }

     // Add button beside the share button under the main post
     const mainPost = document.querySelector('.question, .s-prose');
     if (mainPost) {
         const mainPostId = mainPost.dataset.questionid || mainPost.id.match(/\d+/)[0]; // Adjust as needed
         const shareButton = mainPost.closest('.postcell').querySelector('.js-share-link');
         if (shareButton && !mainPost.querySelector('.inline-edit-button')) {
             const editButton = createInlineEditButton(mainPostId);
             editButton.classList.add('inline-edit-button');
             shareButton.parentNode.appendChild(editButton);
         }
     }

     // Add button beside the share button under each reply
     const replies = document.querySelectorAll('[id^="js-reply-"]');
     replies.forEach(reply => {
         const replyId = extractPostId(reply);
         if (replyId) {
             const shareButton = reply.querySelector('.js-share-link');
             if (shareButton && !reply.querySelector('.inline-edit-button')) {
                 const editButton = createInlineEditButton(replyId);
                 editButton.classList.add('inline-edit-button');
                 shareButton.parentNode.appendChild(editButton);
             }
         }
     });
     })();
