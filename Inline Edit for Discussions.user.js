// ==UserScript==
// @name         Inline Edit for Discussions
// @namespace    https://github.com/MdoubleDash
// @version      0.2
// @description  Adds an "inline edit" button beside the share button under each post and reply
// @author       MDoubleDash (@M--)
// @match        https://stackoverflow.com/beta/discussions/*
// @match        https://stackoverflow.com/posts/*/edit-inline
// @downloadURL  https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Inline%20Edit%20for%20Discussions.user.js
// @updateURL    https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Inline%20Edit%20for%20Discussions.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Inline Edit page tweaks
    function customStyles() {
        if (window.location.href.includes('/edit-inline')) {
            const styles = `
                .js-stacks-editor-container { display: none; }
                .flex--item.pt8 { display: none; }
                .flex--item.js-answer-help-close-btn { display: none; }
                .edit-block { display: none; }
                .js-stacks-editor-backing-textarea { width: 650px; height: 300px; }
                body { zoom: 150%; }
                #title, #tagnames, .js-stacks-editor-backing-textarea, .edit-comment { font-size: 12px; }
                #title { height: auto; overflow: hidden; resize: none; white-space: pre-wrap; }
            `;
            document.documentElement.insertAdjacentHTML('beforeend', `<style type="text/css" id="screen-reader">${styles}</style>`);
        }
    }

    customStyles();

    // Function to add title and tags fields to the inline edit form
    function addTitleAndTagsFields() {
        const form = document.querySelector('.inline-post');
        if (form) {
            // Check if the form is for the main post
            const isMainPost = localStorage.getItem('isMainPost') === 'true';
            if (isMainPost) {
                // Extract existing title and tags from the discussions page
                const existingTitle = localStorage.getItem('discussionTitle') || '';
                const existingTags = localStorage.getItem('discussionTags') || '';

                // Add title field
                const titleFieldHTML = `
                    <div style="position: relative;" class="js-post-editor-title-container">
                        <div class="form-item d-flex fd-column pt0 js-stacks-validation">
                            <div class="d-flex jc-space-between">
                                <label for="title" class="flex--item s-label mb4">Title<abbr class="s-required-symbol" title="required">*</abbr></label>
                                <div class="flex--item ta-right text-counter mr0 fs-caption mt4"></div>
                            </div>
                            <div class="ps-relative">
                                <textarea id="title" class="flex--item s-input w100 js-post-title-field" name="title" maxlength="300" tabindex="100" data-min-length="15" data-max-length="150" placeholder="e.g. Is there an R function for finding the index of an element in a vector?" style="width: 600px; white-space: pre-wrap;">${existingTitle}</textarea>
                                <svg aria-hidden="true" class="s-input-icon js-invalid-alert d-none svg-icon iconAlertCircle" width="18" height="18"  viewBox="0 0 18 18"><path  d="M9 17c-4.36 0-8-3.64-8-8s3.64-8 8-8 8 3.64 8 8-3.64 8-8 8M8 4v6h2V4zm0 8v2h2v-2z"/></svg>
                            </div>
                            <div id="title-validation-message" class="s-input-message mt4 d-none js-stacks-validation-message"></div>
                        </div>
                    </div>
                `;

                // Add tags field
                const tagsFieldHTML = `
                    <div class="ps-relative">
                        <div class="form-item p0 js-stacks-validation js-tag-editor-container ">
                            <div class="d-flex ai-center jc-space-between">
                                <label for="tagnames" class="s-label mb4 d-block flex--item fl1 ">
                                    Tags<abbr class="s-required-symbol" title="required">*</abbr>
                                </label>
                            </div>
                            <div class="d-flex fd-column g4 ps-relative">
                                <div class="ps-relative">
                                    <input id="tagnames" class="s-input box-border js-post-tags-field" name="tagnames" type="text" size="60" value="${existingTags}" tabindex="103" placeholder="e.g. (c c&#x2B;&#x2B; sql-server)" style="width: 600px;">
                                </div>
                                <div class="js-community-icons"></div>
                            </div>
                            <div id="js-tagnames-validation-message" class="s-input-message d-none js-stacks-validation-message"></div>
                        </div>
                    </div>
                `;

                form.insertAdjacentHTML('afterbegin', tagsFieldHTML);
                form.insertAdjacentHTML('afterbegin', titleFieldHTML);

                // Adjust the height of the title field based on its content
                const titleField = document.getElementById('title');
                titleField.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = (this.scrollHeight) + 'px';
                });
                titleField.dispatchEvent(new Event('input'));
            }
        }
    }

    // Initial check
    addTitleAndTagsFields();

    // Make the cancel button close the page
    document.addEventListener('click', function (event) {
        if (event.target.matches('.cancel-edit')) {
            window.close();
        }
    });

    // Function to create the inline edit button
    function createInlineEditButton(postId, isMainPost) {
        const button = document.createElement('button');
        button.textContent = 'Inline Edit';
        button.className = 's-btn s-btn__link fc-black-600'; // Match the style of existing buttons
        button.style.marginLeft = '10px';
        button.onclick = function () {
            // Store the title and tags in localStorage before navigating to the inline edit page
            const title = document.querySelector('.s-page-title--header')?.textContent.trim() || '';
            const tags = Array.from(document.querySelector('.postcell .d-flex.ai-center.fw-wrap.gx8.gy1.sm\\:pb12').querySelectorAll('.s-tag.post-tag')).map(tag => tag.textContent).join(' ');
            localStorage.setItem('discussionTitle', title);
            localStorage.setItem('discussionTags', tags);
            localStorage.setItem('isMainPost', isMainPost);

            window.open(`https://stackoverflow.com/posts/${postId}/edit-inline`, '_blank');
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
            const editButton = createInlineEditButton(mainPostId, true);
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
                const editButton = createInlineEditButton(replyId, false);
                editButton.classList.add('inline-edit-button');
                shareButton.parentNode.appendChild(editButton);
            }
        }
    });

})();
