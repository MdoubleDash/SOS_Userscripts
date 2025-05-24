// ==UserScript==
// @name         Lobby Lighthouse
// @namespace    https://github.com/MdoubleDash
// @version      0.3
// @description  Add message templates for Stack Overflow/Stack Exchange lobbies in Chat
// @author       MDoubleDash (@M--)
// @match        https://chat.stackexchange.com/rooms/158962/stack-exchange-lobby
// @match        https://chat.stackoverflow.com/rooms/259507/stack-overflow-lobby
// @match        https://chat.stackexchange.com/rooms/1/sandbox
// @match        https://chat.stackoverflow.com/rooms/1/sandbox
// @downloadURL  https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Lobby%20Lighthouse.user.js
// @downloadURL  https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Lobby%20Lighthouse.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Add styles
    GM_addStyle(`
        .lighthouse-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #35393a;
            border: 1px solid #000;
            border-radius: 4px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            display: none;
            flex-direction: column;
            font-family: Arial, sans-serif;
            color: #fff;
        }

        .lighthouse-popup {
            width: 50%;
            height: 70%;
        }

        .lighthouse-edit-modal {
            width: 60%;
            height: 75%;
            z-index: 10001;
        }

        .lighthouse-header {
            padding: 12px;
            border-bottom: 1px solid #000;
            background: #35393a;
            border-radius: 4px 4px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .lighthouse-header h3 {
            margin: 0;
            color: #fff;
        }

        .lighthouse-content {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
        }

        .lighthouse-edit-content {
            flex: 1;
            padding: 12px;
            display: flex;
            flex-direction: column;
        }

        .lighthouse-btn {
            background: #5a9fd4;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-right: 10px;
        }

        .lighthouse-btn:hover {
            background: #4a8bc2;
        }

        .lighthouse-btn-large {
            background: #5a9fd4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        .lighthouse-btn-large:hover {
            background: #4a8bc2;
        }

        .lighthouse-btn-cancel {
            background: #6c757d;
        }

        .lighthouse-btn-cancel:hover {
            background: #5a6268;
        }

        .lighthouse-btn-danger {
            background: #dc3545;
        }

        .lighthouse-btn-danger:hover {
            background: #c82333;
        }

        .lighthouse-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 5px;
            color: #fff;
        }

        .lighthouse-close:hover {
            color: #8ac4f6;
        }

        .message-template {
            padding: 12px;
            margin-bottom: 12px;
            background: #35393a;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
            word-wrap: break-word;
            overflow-wrap: break-word;
            border: 1px solid #555;
        }

        .message-template:hover {
            background-color: #4a4f50;
            border-color: #8ac4f6;
        }

        .message-template .title {
            font-size: 14px;
            margin-bottom: 5px;
            color: #8ac4f6;
            word-wrap: break-word;
        }

        .message-template .body {
            color: #ccc;
            font-size: 12px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            font-weight: bold;
        }

        .lighthouse-textarea {
            flex: 1;
            font-family: monospace;
            font-size: 12px;
            border: 1px solid #000;
            border-radius: 4px;
            padding: 10px;
            resize: none;
            margin-bottom: 12px;
            background: #35393a;
            color: #fff;
        }

        .lighthouse-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: none;
        }

        .lighthouse-button-group {
            display: flex;
            gap: 10px;
        }
    `);

    // Default messages
    const defaultMessages = [
        {
            title: "Welcome Message",
            site: "SO",
            body: "Welcome! Please read the [description](https://chat.stackoverflow.com/rooms/259507#:~:text=" +
            "The%20beginner%2Dfriendly%20chat%20room%20for%20all%20users%20on%20Stack%20Overflow.%20Here%2C%20you%20can%20have%20real%2Dtime%20conversations%20with%20others%20in%20the%20community%2C%20learn%2C%20discover%2C%20and%20solve%20together%2C%20and%20more%20%2D%20no%20matter%20your%20reputation%20score) " +
            "and abide by the [Code of Conduct](//stackoverflow.com/conduct). Have fun!"
        },
        {
            title: "Welcome Message",
            site: "MSE",
            body: "Welcome! Please read the [description](//chat.stackexchange.com/rooms/158962#:~:text=" +
            "The%20beginner%2Dfriendly%20chat%20room%20for%20all%20users%20on%20the%20Stack%20Exchange%20network.%20Here%2C%20you%20can%20have%20real%2Dtime%20conversations%20with%20others%20in%20the%20community%2C%20learn%2C%20discover%2C%20and%20solve%20together%2C%20and%20more%20%2D%20no%20matter%20your%20reputation%20score) " +
            "and abide by the [Code of Conduct](//meta.stackexchange.com/conduct). Have fun!"
        },
        {
            title: "Getting Started",
            site: "SO",
            body: "Welcome to Stack Overflow! Review the [Tour](//stackoverflow.com/tour) for an overview of the site. For Chat-specific questions, see the [FAQ](//chat.stackoverflow.com/faq). " +
            "If you're planning to contribute to the site, you should review the [help page](//stackoverflow.com/help), especially [How to ask](//stackoverflow.com/help/how-to-ask). " +
            "If you have a specific question about the network, someone here can likely answer or point you to an answer."
        },
        {
            title: "Getting Started",
            site: "MSE",
            body: "Welcome to Meta Stack Exchange! Review the [Tour](//meta.stackexchange.com/tour) and [What is Meta](//meta.stackexchange.com/help/whats-meta) for an overview of the site. " +
            "For Chat-specific questions, see the [FAQ](//chat.meta.stackexchange.com/faq). If you have a specific question about the network, someone here can likely answer or point you to an answer."
        },
        {
            title: "English Only",
            site: "SO",
            body: "Please use English; Stack Overflow requires content to be in [English](//stackoverflow.com/help/non-english-questions). " +
            "If English isn't a language you can communicate in, there are alternative sites available in the community that may be in a language you are more fluent in."
        },
        {
            title: "English Only",
            site: "MSE",
            body: "Please use English; Meta Stack Exchange requires content to be in [English](//meta.stackexchange.com/q/13676)."
        },
        {
            title: "Code Dump",
            site: "SO",
            body: "Dumping code/errors with no context or merely describing your issue won't get much help. " +
            "Can you elaborate on how your code doesn't work? What were you expecting, and what actually happened? " +
            "Consider [asking a question](//stackoverflow.com/questions/ask) on the main site. " +
            "For help, review [How to Ask](//stackoverflow.com/help/how-to-ask)."
        },
        {
            title: "Downvote",
            site: "SO",
            body: "Many reasons exist for a downvote; read about them [here](//meta.stackoverflow.com/q/252677). " +
            "You should [not assume who has downvoted your post](//meta.stackoverflow.com/q/388686). " +
            "Also, please note that it is [not required to leave a comment when voting](//meta.stackoverflow.com/q/357436) on a post."
        },
        {
            title: "Downvote",
            site: "MSE",
            body: "Many reasons exist for a downvote; read about them [here](//meta.stackexchange.com/a/121351). " +
            "You should [not assume who has downvoted your post](//meta.stackexchange.com/q/12984). " +
            "Also, please note that it is [not required to leave a comment when voting](//meta.stackexchange.com/q/325416) on a post."
        },
        {
            title: "SPAM",
            site: "SO",
            body: "Excessive promotion of a specific product/resource (especially if affiliated) may be perceived by the community as **spam**. " +
            "Take a look at [What kind of behavior is expected of users?](https://stackoverflow.com/help/behavior)'s last section: ***Avoid overt self-promotion***. " +
            "You might also be interested in [How to not be a spammer](//stackoverflow.com/help/promotion) and [How do I advertise on Stack Overflow?](//stackoverflow.co/advertising/)."
        },
        {
            title: "SPAM",
            site: "MSE",
            body: "Excessive promotion of a specific product/resource (especially if affiliated) may be perceived by the community as **spam**. " +
            "Review [What kind of behavior is expected of users?](https://meta.stackexchange.com/help/behavior)'s last section: ***Avoid overt self-promotion***. " +
            "You might also be interested in [How to not be a spammer](//meta.stackexchange.com/help/promotion)."

        },
        {
            title: "No AI prompts",
            site: "",
            body: "Please note that this is a chat of human beings. Keep that in mind and communicate accordingly. Try to avoid the impression that you confuse this with an AI prompt."
        }
    ];

    // Load messages from storage or use defaults
    let messageTemplates = GM_getValue('messageTemplates', defaultMessages);
    let currentSite = '';

    // Determine current site
    function getCurrentSite() {
        if (window.location.hostname.includes('stackoverflow')) {
            return 'stackoverflow';
        } else if (window.location.hostname.includes('stackexchange')) {
            return 'stackexchange';
        }
        return 'other';
    }

    // Filter messages based on current site
    function getFilteredMessages() {
        return messageTemplates.filter(msg => {
            // If no site specified or empty site, show on all sites
            if (!msg.site || msg.site.trim() === '') {
                return true;
            }

            const site = msg.site.toUpperCase();

            // If on Stack Overflow, show SO messages
            if (currentSite === 'stackoverflow' && site === 'SO') {
                return true;
            }

            // If on Stack Exchange/Meta, show MSE messages
            if (currentSite === 'stackexchange' && site === 'MSE') {
                return true;
            }

            // Hide site-specific messages on wrong sites
            return false;
        });
    }

    // Parse messages
    function parseMessages(text) {
        const messages = [];
        const sections = text.split(/\n## /).filter(section => section.trim());

        sections.forEach(section => {
            const lines = section.split('\n');
            const title = lines[0].replace(/^## /, '').trim();

            let site = '';
            let bodyStartIndex = 1;

            // Check if second line is a site specification (starts with ###)
            if (lines[1] && lines[1].startsWith('###')) {
                site = lines[1].replace(/^### ?/, '').trim();
                bodyStartIndex = 2;
            }

            const body = lines.slice(bodyStartIndex).join('\n').trim();

            if (title && body) {
                messages.push({ title, site, body });
            }
        });

        return messages;
    }

    // Convert messages to text format
    function messagesToText(messages) {
        return messages.map(msg => {
            let text = `## ${msg.title}`;
            if (msg.site && msg.site.trim()) {
                text += `\n### ${msg.site}`;
            }
            text += `\n${msg.body}`;
            return text;
        }).join('\n\n');
    }

    // Save messages to storage
    function saveMessages() {
        GM_setValue('messageTemplates', messageTemplates);
    }

    // Revert to default messages
    function revertToDefaults() {
        if (confirm('Are you sure you want to revert to the original default messages? This will delete all your custom messages.')) {
            GM_deleteValue('messageTemplates');
            messageTemplates = [...defaultMessages]; // Create a copy of the default messages -- not sure if this is the best method to achieve this
            const textarea = document.getElementById('edit-textarea');
            textarea.value = messagesToText(messageTemplates);
        }
    }

    // Create the popup HTML/style
    function createPopupHTML() {
        return `
            <div id="message-templates-popup" class="lighthouse-modal lighthouse-popup">
                <div class="lighthouse-header">
                    <h3>Lobby Lighthouse</h3>
                    <div>
                        <button id="edit-messages-button" class="lighthouse-btn">Edit</button>
                        <button id="close-popup" class="lighthouse-close">×</button>
                    </div>
                </div>
                <div class="lighthouse-content">
                    <div id="message-list"></div>
                </div>
            </div>

            <div id="edit-modal" class="lighthouse-modal lighthouse-edit-modal">
                <div class="lighthouse-header">
                    <h3>Edit Messages</h3>
                    <button id="close-edit-modal" class="lighthouse-close">×</button>
                </div>
                <div class="lighthouse-edit-content">
                    <textarea id="edit-textarea" class="lighthouse-textarea" placeholder="## Message Title
### SO
Message body here.

## Another Message
###
Another message body (shows on all sites).

## Generic Message
Message body (no site line - shows on all sites)."></textarea>

                    <div class="lighthouse-button-group">
                        <button id="save-edit-button" class="lighthouse-btn-large">Save</button>
                        <button id="cancel-edit-button" class="lighthouse-btn-large lighthouse-btn-cancel">Cancel</button>
                        <button id="revert-to-defaults-button" class="lighthouse-btn-large lighthouse-btn-danger">Revert to Defaults</button>
                    </div>
                </div>
            </div>

            <div id="popup-overlay" class="lighthouse-overlay"></div>
        `;
    }

    // Render message list
    function renderMessageList() {
        const messageList = document.getElementById('message-list');
        const filteredMessages = getFilteredMessages();

        if (filteredMessages.length === 0) {
            messageList.innerHTML = '<p style="text-align: center; color: #ccc; padding: 20px;">No messages available for this site.</p>';
            return;
        }

        messageList.innerHTML = filteredMessages.map((msg, index) => `
            <div class="message-template" data-original-index="${messageTemplates.indexOf(msg)}">
                <div class="title">${msg.title}</div>
                <div class="body">${msg.body}</div>
            </div>
        `).join('');

        addClickHandlers();
    }

    // Click handlers
    function addClickHandlers() {
        document.querySelectorAll('.message-template').forEach((template) => {
            template.addEventListener('click', function() {
                const originalIndex = parseInt(this.getAttribute('data-original-index'));
                const messageBody = messageTemplates[originalIndex].body;
                addMessageToInput(messageBody);
            });
        });
    }

    // Show the popup
    function showPopup() {
        const popup = document.getElementById('message-templates-popup');
        const overlay = document.getElementById('popup-overlay');
        popup.style.display = 'flex';
        overlay.style.display = 'block';
        renderMessageList();
    }

    // Hide the popup
    function hidePopup() {
        const popup = document.getElementById('message-templates-popup');
        const overlay = document.getElementById('popup-overlay');
        popup.style.display = 'none';
        overlay.style.display = 'none';
    }

    // Show edit modal
    function showEditModal() {
        const modal = document.getElementById('edit-modal');
        const textarea = document.getElementById('edit-textarea');
        modal.style.display = 'flex';
        textarea.value = messagesToText(messageTemplates);
    }

    // Hide edit modal
    function hideEditModal() {
        const modal = document.getElementById('edit-modal');
        modal.style.display = 'none';
    }

    // Save edited messages
    function saveEditedMessages() {
        const textarea = document.getElementById('edit-textarea');
        const text = textarea.value;
        messageTemplates = parseMessages(text);
        saveMessages();
        hideEditModal();
        renderMessageList();
    }

    // Add message to input area
    function addMessageToInput(messageBody) {
        const input = document.getElementById('input');
        if (input) {
            const currentText = input.value;
            const newText = currentText + (currentText ? ' ' : '') + messageBody;
            input.value = newText;

            // Focus the input and move cursor to end
            input.focus();
            input.setSelectionRange(newText.length, newText.length);

            // Trigger input event to update character count: https://github.com/MdoubleDash/SOS_Userscripts/blob/main/Chat%20Input%20Character%20Count.user.js
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        hidePopup();
    }

    // Initialize the userscript
    function init() {
        // Check if already initialized
        if (document.getElementById('templates-button')) {
            return;
        }

        // Determine current site
        currentSite = getCurrentSite();

        // Chat-buttons container
        const chatButtons = document.getElementById('chat-buttons');
        if (!chatButtons) {
            // console.log('Chat buttons container not found'); // Debugging
            return;
        }

        // Create the templates button
        const templatesButton = document.createElement('button');
        templatesButton.className = 'button';
        templatesButton.id = 'templates-button';
        templatesButton.textContent = 'Lighthouse...';
        templatesButton.title = 'Insert message template';

        // Add the button right after the say-it button
        const sayitButton = document.getElementById('sayit-button');
        if (sayitButton && sayitButton.parentNode === chatButtons) {

            sayitButton.insertAdjacentElement('afterend', templatesButton);
            sayitButton.insertAdjacentText('afterend', '\n'); // Add <whitespace>
        } else {
            // Fallback: just append to chat-buttons
            chatButtons.appendChild(templatesButton);
        }

        // popup HTML
        document.body.insertAdjacentHTML('beforeend', createPopupHTML());

        // Event listeners
        templatesButton.addEventListener('click', showPopup);
        document.getElementById('close-popup').addEventListener('click', hidePopup);
        document.getElementById('popup-overlay').addEventListener('click', hidePopup);

        document.getElementById('edit-messages-button').addEventListener('click', showEditModal);
        document.getElementById('close-edit-modal').addEventListener('click', hideEditModal);
        document.getElementById('save-edit-button').addEventListener('click', saveEditedMessages);
        document.getElementById('cancel-edit-button').addEventListener('click', hideEditModal);
        document.getElementById('revert-to-defaults-button').addEventListener('click', revertToDefaults);

        // Close popup with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (document.getElementById('edit-modal').style.display === 'flex') {
                    hideEditModal();
                } else {
                    hidePopup();
                }
            }
        });

        console.log('Message templates userscript loaded successfully');
    }

    // Wait for the page to load completely
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also try to initialize after a short delay in case the chat interface loads dynamically
    setTimeout(init, 1000);

})();
