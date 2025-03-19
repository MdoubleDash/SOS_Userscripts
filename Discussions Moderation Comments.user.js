// ==UserScript==
// @name         Discussions Moderation Comments
// @namespace    https://github.com/MdoubleDash
// @version      0.5
// @description  show a pop-up with pre-compiled messages when discussion text box is right-clicked
// @author       MDoubleDash (@M--), PurpleMagick (@VLAZ)
// @match        https://stackoverflow.com/beta/discussions/*
// @downloadURL  https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Discussions%20Moderation%20Comments.user.js
// @downloadURL  https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Discussions%20Moderation%20Comments.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// ==/UserScript==

// temp popup to extract the background color
const popup = document.createElement('div');
popup.classList.add('s-popover', 's-popover__tooltip', 'is-visible');
popup.id = 'temp-popup';
document.body.appendChild(popup);

// Get the computed background color of the popup
const computedStyle = getComputedStyle(popup);
const backgroundColor = computedStyle.backgroundColor;
document.body.removeChild(popup);

// Convert the background color to rgba with transparency
const rgbaColor = backgroundColor.replace('rgb', 'rgba').replace(')', ', 0.9)');

GM_addStyle(`
    .discussion-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        width: 70%;
        height: 70%;
        max-width: 70%;
        max-height: 70%;
        overflow: auto;
        background-color: rgbaColor
    }
    .modal-content {
        padding: 12px;
        border: 1px solid #000;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    .close-button {
        margin-left: auto;
        align-self: flex-start;
    }
    .checkbox-container {
        display: flex;
        align-items: center;
    }
    .search-input {
        margin-bottom: 12px;
    }
    .text-element {
        margin-bottom: 12px;
        padding: 12px;
        background-color: rgbaColor;
        border-radius: 4px;
        cursor: pointer;
    }

    .edit-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        width: 70%;
        height: 70%;
        max-width: 70%;
        max-height: 70%;
        overflow: auto;
        background-color: rgbaColor
    }
    .edit-modal-content {
        padding: 12px;
        border: 1px solid #000;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }
    .textarea {
        flex: 1;
        width: 100%;
        height: 100%;
        margin-bottom: 12px;
    }


    .saveEdit-button {
        background-color: #007bff;
        color: #ffffff;
        margin-bottom: 12px;
    }
`);

(function() {
    'use strict';

    // Load pre-compiled texts from local storage or use default values
    let preCompiledComments = GM_getValue('preCompiledComments', [
        { title: "Unclear and/or low quality discussion",
            text: "If you want to start a conversation about this topic please add more detail or specifics and then repost it. Alternatively, if you are looking to get a specific answer to a programming problem, that should be [posted as a Question](https://stackoverflow.com/help/how-to-ask), rather than a Discussion post."
        },
        { title: "Repost of own Question as a discussion",
            text: "Discussions should not be used to draw more attention to existing Questions on Stack Overflow. This Discussions space is intended for more general conversations about technical concepts, including subjective opinions (see the [Discussions guidelines](https://stackoverflow.com/help/discussions-guidelines)). If you have an idea for something that would be interesting to discuss feel free to make a new Discussion post."
        },
        { title: "Discussion in a language other than English",
            text: "This is written in a language other than English. While we understand that this may be frustrating, we don't have the moderation capacity to allow posts to be written in any human language. We suggest using machine translation (such as Google Translate) to translate your post into English and then reposting it. [See this page](https://stackoverflow.com/help/non-english-questions) for more information."
        },
        { title: "Spam from a experienced user (e.g. promotional but relevant, not from a brand new account)",
            text: "This appears to be [spam](https://stackoverflow.com/help/promotion) or is not attempting to start any meaningful interaction. Stack Overflow is a community dedicated to helping developers learn and share knowledge about programming and technical concepts. We encourage contributions that align with this mission and adhere to our [community guidelines](https://stackoverflow.com/help/behavior)."
        },
        { title: "Spam (posting without disclosure or excessive promotion)",
            text: "Excessive promotion of a specific product/resource may be perceived by the community as **spam**. Take a look at the [the Stack Overflow Help Center](https://stackoverflow.com/help), especially [What kind of behavior is expected of users?](https://stackoverflow.com/help/behavior)'s last section: _Avoid overt self-promotion_. You might also be interested in [How to not be a spammer](https://stackoverflow.com/help/promotion) and [How do I advertise on Stack Overflow?](https://stackoverflow.com//help/advertising)."
        },
        { title: "Seeking or posting a job opportunity",
            text: "Posting or seeking job opportunities is discouraged in the Discussions space [per the Discussions guidelines](https://stackoverflow.com/help/discussions-guidelines). However, you may be interested in checking out [Stack Overflow Jobs](https://stackoverflow.jobs/?source=so-left-nav), which is also linked from the left navigation of Stack Overflow under 'Labs'."
        },
        { title: "New user, Should be a Question",
            text: "This seems like a specific programming question, rather than a conversation starter. With more detail added, this may be better as a Question rather than a Discussions post. Please see [this page](https://stackoverflow.com/help/how-to-ask) for help on asking a question on Stack Overflow. If you are interested in starting a more general conversation about how to approach a technical issue or concept, feel free to make another Discussion post."
        },
        { title: "Experienced User, Should be a Question",
            text: "This seems like more of a specific programming question, rather than a conversation starter. Unlike Q&A on Stack Overflow, the Discussions space is intended for more general conversations, including subjective opinions (see the [Discussions guidelines](https://stackoverflow.com/help/discussions-guidelines)). If you have an idea for something that would be interesting to discuss feel free to make a new Discussion post."
        },
        { title: "Replies to a post that should be a Question",
            text:  "This  programming-specific and should have been posted in the Q&A section. It's good to see that the OP has gotten some help. We don't want to leave this visible to possibly confuse people about what goes in Discussions vs Q&A."
        },
        { title: "Unclear discussion or reply",
            text: "Discussions space is intended for conversations about technical concepts ([see the Discussions guidelines](https://stackoverflow.com/help/discussions-guidelines)). Your post does not seem like it's intended to start a discussion. If you have an idea for something that would be interesting to discuss feel free to make a new Discussion post."
        },
        { title: "Comment or Follow-up question posted as discussion",
            text : "It appears you have been misled by Stack Overflow's latest [experiment](https://meta.stackoverflow.com/q/433151). Despite what you were told, Discussions is not the place for follow-up questions, but for [discussions](https://stackoverflow.com/help/discussions-guidelines), and the person you wanted to be notified about your post here (in Discussions) was ***not*** notified. You should post this as a comment on the original post or, if you have a new question post a (new) [question](https://stackoverflow.com/questions/ask), demonstrating your attempt to implement a solution and explain why it didn't work."
        },
        { title: "AI generated content",
            text: "*All* use of generative AI (e.g., ChatGPT and other LLMs) is banned when posting content on Stack Overflow. This includes 'asking' the question to an AI generator then copy-pasting its output *as well as* using an AI generator to 'reword' your answers. Please see the Help Center article: [What is this site's policy on content generated by generative artificial intelligence tools?](https://stackoverflow.com/help/ai-policy)."
        }
    ]);

    // Function to parse the comments from a string
    function parseComments(text) {
        const comments = [];
        const lines = text.split('\n');
        let currentComment = null;

        lines.forEach(line => {
            if (line.startsWith('### ')) {
                if (currentComment) {
                    comments.push(currentComment);
                }
                currentComment = { title: line.substring(4), text: '' };
            } else if (currentComment) {
                currentComment.text += line + '\n';
            }
        });

        if (currentComment) {
            comments.push(currentComment);
        }

        return comments.map(comment => ({
            title: comment.title,
            text: comment.text.trim()
        }));
    }

    // Function to deparse the comments to a string
    function deparseComments(comments) {
        return comments.map(comment => `### ${comment.title}\n${comment.text}`).join('\n\n');
    }

    // Function to create and show the modal window
    function showPopup(target) {
        // Create the modal container
        const modal = document.createElement('div');
        modal.classList.add('s-popover', 's-popover__tooltip', 'is-visible', 'discussion-modal');
        modal.id = 'discussion-modal';

        // Create the modal content
        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');

        // Create the modal header
        const modalHeader = document.createElement('div');
        modalHeader.classList.add('modal-header');

        // Check if the specific <a> element exists
        const editLink = document.querySelector('a[href^="/beta/discussions/edit/"]');
        if (editLink) {
            // Add the checkbox to the header
            const checkboxContainer = document.createElement('div');
            checkboxContainer.classList.add('checkbox-container');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'delete-post-checkbox';

            // Load the checkbox state from storage
            checkbox.checked = GM_getValue('deletePostCheckboxState', false);

            const label = document.createElement('label');
            label.htmlFor = 'delete-post-checkbox';
            label.innerHTML = '<strong>Are you deleting the post?</strong>'; // Make the text bold
            label.style.marginLeft = '8px';

            checkbox.addEventListener('change', () => {
                // Save the checkbox state to storage
                GM_setValue('deletePostCheckboxState', checkbox.checked);
            });

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            modalHeader.appendChild(checkboxContainer);
        }

        // Create the close button
        const closeButton = document.createElement('button');
        closeButton.classList.add('s-btn', 's-btn__muted', 's-btn__icon', 'close-button');
        closeButton.innerHTML = '<svg aria-hidden="true" class="svg-icon iconClear" width="18" height="18" viewBox="0 0 18 18"><path d="M15 4.41L13.59 3 9 7.59 4.41 3 3 4.41 7.59 9 3 13.59 4.41 15 9 10.41 13.59 15 15 13.59 10.41 9z"></path></svg>';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
            document.removeEventListener('click', onClickOutside);
        });

        modalHeader.appendChild(closeButton);
        modalContent.appendChild(modalHeader);

        // Create the search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
        searchInput.classList.add('s-input', 'search-input');
        modalContent.appendChild(searchInput);

        // Function to render the pre-compiled texts
        function renderTexts(filter = '') {
            // Clear existing texts
            const existingTexts = modalContent.querySelectorAll('.text-element');
            existingTexts.forEach(text => text.remove());

            // Add pre-compiled texts to the modal
            preCompiledComments.forEach(item => {
                if (item.title.toLowerCase().includes(filter.toLowerCase()) || item.text.toLowerCase().includes(filter.toLowerCase())) {
                    const textElement = document.createElement('div');
                    textElement.classList.add('s-block-link', 's-block-link__hover', 'text-element');
                    textElement.style.cursor = 'pointer';

                    const titleElement = document.createElement('span');
                    titleElement.textContent = item.title;
                    titleElement.style.fontWeight = 'bold';
                    titleElement.style.marginRight = '5px';

                    const arrowElement = document.createElement('span');
                    arrowElement.textContent = '▼';
                    arrowElement.style.cursor = 'pointer';

                    const fullTextElement = document.createElement('div');
                    fullTextElement.textContent = item.text;
                    fullTextElement.style.display = 'none';
                    fullTextElement.style.marginTop = '5px';

                    arrowElement.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent the click from propagating to the textElement
                        fullTextElement.style.display = fullTextElement.style.display === 'none' ? 'block' : 'none';
                    });

                    textElement.appendChild(titleElement);
                    textElement.appendChild(arrowElement);
                    textElement.appendChild(fullTextElement);

                    textElement.addEventListener('click', () => {
                        const isDeletingPost = document.getElementById('delete-post-checkbox')?.checked;
                        const prefix = isDeletingPost ? "We have removed your post. " : "";
                        target.textContent += prefix + item.text;
                        document.body.removeChild(modal);
                        document.removeEventListener('click', onClickOutside);
                    });

                    fullTextElement.addEventListener('click', () => {
                        const isDeletingPost = document.getElementById('delete-post-checkbox')?.checked;
                        const prefix = isDeletingPost ? "We have removed your post. " : "";
                        target.textContent += prefix + item.text;
                        document.body.removeChild(modal);
                        document.removeEventListener('click', onClickOutside);
                    });

                    modalContent.appendChild(textElement);
                }
            });
        }

        // Initial render of texts
        renderTexts();

        // Add event listener to search input
        searchInput.addEventListener('input', (e) => {
            renderTexts(e.target.value);
        });

        // Create the edit button
        const editButton = document.createElement('button');
        editButton.classList.add('s-btn', 's-btn__primary', 'saveEdit-button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            showEditModal(modal);
        });

        modalContent.appendChild(editButton);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add event listener to hide the modal on escape key press
        document.addEventListener('keydown', function onKeydown(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', onKeydown);
                document.removeEventListener('click', onClickOutside);
            }
        });

        // Function to hide the modal when clicking outside
        function onClickOutside(e) {
            const editModal = document.getElementById('edit-modal');
            if (!modalContent.contains(e.target) && e.target !== target && (!editModal || !editModal.contains(e.target))) {
                document.body.removeChild(modal);
                document.removeEventListener('click', onClickOutside);
            }
        }

        // Add event listener to hide the modal on clicking outside
        document.addEventListener('click', onClickOutside);
    }

    // Function to show the edit modal
    function showEditModal(modal) {
        // Create the edit modal container
        const editModal = document.createElement('div');
        editModal.classList.add('s-popover', 's-popover__tooltip', 'is-visible', 'edit-modal');
        editModal.id = 'edit-modal';

        // Create the edit modal content
        const editModalContent = document.createElement('div');
        editModalContent.classList.add('edit-modal-content');

        // Create the close button for the edit modal
        const closeButton = document.createElement('button');
        closeButton.classList.add('s-btn', 's-btn__muted', 's-btn__icon', 'close-button');
        closeButton.innerHTML = '<svg aria-hidden="true" class="svg-icon iconClear" width="18" height="18" viewBox="0 0 18 18"><path d="M15 4.41L13.59 3 9 7.59 4.41 3 3 4.41 7.59 9 3 13.59 4.41 15 9 10.41 13.59 15 15 13.59 10.41 9z"></path></svg>';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(editModal);
        });

        editModalContent.appendChild(closeButton);

        // Create the textarea for editing comments
        const textarea = document.createElement('textarea');
        textarea.classList.add('s-textarea', 'textarea');
        textarea.style.flex = '1';
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.value = deparseComments(preCompiledComments);
        editModalContent.appendChild(textarea);

        // Create the save button
        const saveButton = document.createElement('button');
        saveButton.classList.add('s-btn', 's-btn__primary', 'saveEdit-button');
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the click from propagating to the onClickOutside
            preCompiledComments = parseComments(textarea.value);
            GM_setValue('preCompiledComments', preCompiledComments); // Save to local storage
            document.body.removeChild(editModal);
            showPopup(document.querySelector('.js-editor')); // Go back to the list of comments
        });

        editModalContent.appendChild(saveButton);

        editModal.appendChild(editModalContent);
        document.body.appendChild(editModal);
    }

    document.addEventListener('contextmenu', function(e) {
        let target = e.target;

        // Check if the clicked element is the discussion text box
        if (target.classList.contains('js-editor')) {
            e.preventDefault();
            showPopup(target);
        }
    }, true);

})();
