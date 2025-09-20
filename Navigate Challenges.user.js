// ==UserScript==
// @name         Challenge Navigator
// @namespace    https://github.com/MdoubleDash
// @version      0.9.1
// @description  Adds a navigation menu and collapses viewed posts on Stack Overflow Challenges
// @author       MDoubleDash (M--)
// @match        https://stackoverflow.com/beta/challenges/*
// @match        https://stackoverflow.com/beta/discussions/*
// @grant        none
// @downloadURL  https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Navigate%20Challenges.user.js
// @updateURL    https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Navigate%20Challenges.user.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('Challenge Navigator: Script starting...');

    // CSS styles
    const style = document.createElement('style');
    style.textContent = `
        .deleted-post-collapsed .js-discussion-comment > div:not(.deletion-controls) {
            display: none !important;
        }

        .deleted-post-collapsed [id^="js-reply-"][id$="-body"] > div:not(.deletion-controls) {
            display: none !important;
        }

        .viewed-post-collapsed .js-discussion-comment > div:not(.viewed-controls) {
            display: none !important;
        }

        .viewed-post-collapsed [id^="js-reply-"][id$="-body"] > div:not(.viewed-controls) {
            display: none !important;
        }

        .deleted-post-collapsed, .viewed-post-collapsed {
            margin-bottom: 8px !important;
        }

        .deleted-post-collapsed.mb48, .viewed-post-collapsed.mb48 {
            margin-bottom: 8px !important;
        }

        .deleted-post-collapsed.mb24, .viewed-post-collapsed.mb24 {
            margin-bottom: 8px !important;
        }

        .deletion-controls {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 12px;
            margin: 8px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .viewed-controls {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 12px;
            margin: 8px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .deletion-info {
            display: flex;
            align-items: center;
            color: #dc2626;
            font-size: 14px;
        }

        .viewed-info {
            display: flex;
            align-items: center;
            color: #0369a1;
            font-size: 14px;
        }

        .deletion-icon, .viewed-icon {
            margin-right: 8px;
            font-size: 16px;
        }

        .collapse-toggle {
            background: #dc2626;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .collapse-toggle:hover {
            background: #b91c1c;
        }

        .expand-toggle {
            background: #0369a1;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .expand-toggle:hover {
            background: #1e40af;
        }

        .global-toggle {
            position: fixed;
            top: 60px;
            right: 20px;
            z-index: 1000;
            background: #374151;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .global-toggle:hover {
            background: #1f2937;
        }

        .global-toggle-viewed {
            position: fixed;
            top: 105px;
            right: 20px;
            z-index: 1000;
            background: #0369a1;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .global-toggle-viewed:hover {
            background: #1e40af;
        }

        .post-navigation {
            position: fixed;
            top: 150px;
            right: 20px;
            z-index: 1000;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 300px;
            max-width: 400px;
        }

        .nav-header {
            padding: 12px 16px;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            border-radius: 6px 6px 0 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            user-select: none;
        }

        .nav-header:hover {
            background: #f3f4f6;
        }

        .nav-title {
            font-weight: 600;
            font-size: 14px;
            color: #374151;
        }

        .nav-count {
            background: #6b7280;
            color: white;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }

        .nav-arrow {
            transition: transform 0.2s;
            color: #6b7280;
        }

        .nav-arrow.expanded {
            transform: rotate(180deg);
        }

        .nav-content {
            max-height: 400px;
            overflow-y: auto;
            display: none;
        }

        .nav-content.expanded {
            display: block;
        }

        .nav-item {
            padding: 10px 16px;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .nav-item:hover {
            background: #f9fafb;
        }

        .nav-item:last-child {
            border-bottom: none;
        }

        .nav-item.deleted {
            background: #fef2f2;
            border-left: 3px solid #dc2626;
        }

        .nav-item.deleted:hover {
            background: #fecaca;
        }

        .nav-item.reply {
            padding-left: 32px;
            border-left: 2px solid #e5e7eb;
            background: #f9fafb;
        }

        .nav-item.reply:hover {
            background: #f3f4f6;
        }

        .post-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .post-author {
            font-weight: 500;
            font-size: 13px;
            color: #374151;
        }

        .post-date {
            font-size: 11px;
            color: #6b7280;
        }

        .post-preview {
            font-size: 12px;
            color: #4b5563;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 250px;
        }

        .post-status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 500;
            margin-left: 8px;
        }

        .status-deleted {
            background: #fecaca;
            color: #dc2626;
        }

        .status-normal {
            background: #d1fae5;
            color: #059669;
        }

        .status-viewed {
            background: #bfdbfe;
            color: #1d4ed8;
        }

	.post-checkbox-container {
		    display: flex;
		    align-items: center;
		    justify-content: flex-end;
		    margin-left: auto;
		    gap: 6px;
	    }

	.post-checkbox-label {
		    font-size: 12px;
		    color: #475569;
		    cursor: pointer;
		    user-select: none;
	    }

	.post-checkbox {
	    	margin: 0;
		    cursor: pointer;
		    transform: scale(1.2);
	    }

        /* Scrollbar styling for the navigation menu */
        .nav-content::-webkit-scrollbar {
            width: 6px;
        }

        .nav-content::-webkit-scrollbar-track {
            background: #f1f5f9;
        }

        .nav-content::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
        }

        .nav-content::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    `;
    document.head.appendChild(style);

let allPosts = [];
let navigationMenu = null;
let viewedPosts = new Set(); 

// Try to load saved viewed posts from localStorage
try {
    const saved = localStorage.getItem('challengesViewedPosts');
    if (saved) {
        viewedPosts = new Set(JSON.parse(saved));
    }
} catch (e) {
    console.log('Challenge Navigator: Could not load viewed posts from storage');
}

function saveViewedPosts() {
    try {
        localStorage.setItem('challengesViewedPosts', JSON.stringify([...viewedPosts]));
    } catch (e) {
        console.log('Challenge Navigator: Could not save viewed posts to storage');
    }
}

    function findDeletedPosts() {

        //const deletedByClass = document.querySelectorAll('.bg-red-100');

        const deletedByText = document.querySelectorAll('.fc-red-400');

        const deletedPosts = new Set();

        // Process posts found by deletion text
        deletedByText.forEach(indicator => {
            if (indicator.textContent.includes('Deleted by')) {
                const replyContainer = indicator.closest('.js-reply');
                if (replyContainer) {
                    deletedPosts.add(replyContainer);
                }
            }
        });

        return Array.from(deletedPosts);
    }

    function findAllPosts() {
        // Find all posts (both normal and deleted)
        const posts = [];

        // Only get main posts and direct replies, not nested replies
        const mainPosts = document.querySelectorAll('.js-reply:not(.js-reply .js-reply)');

        mainPosts.forEach((element, index) => {
            // Skip if this is a nested reply (has .js-reply ancestor)
            const hasReplyAncestor = element.closest('.js-reply') !== element;
            if (hasReplyAncestor) {
                return;
            }

            const postInfo = extractPostInfo(element, index);
            if (postInfo) {
                posts.push(postInfo);
            }

            // Direct replies to the main post
            const directReplies = element.querySelectorAll(':scope > div > .js-reply');
            directReplies.forEach((replyElement, replyIndex) => {
                const replyInfo = extractPostInfo(replyElement, index + replyIndex + 0.1);
                if (replyInfo) {
                    // Mark as reply and add indentation info
                    replyInfo.isReply = true;
                    replyInfo.parentId = element.id;
                    posts.push(replyInfo);
                }
            });
        });

        // Sort posts: active posts first (by order), then deleted posts at the bottom (by order)
        return posts.sort((a, b) => {
            if (a.isDeleted && !b.isDeleted) return 1; // a is deleted, b is not - a goes after b
            if (!a.isDeleted && b.isDeleted) return -1; // a is not deleted, b is - a goes before b
            return a.order - b.order; // Both same deletion status, sort by order
        });
    }

    function extractPostInfo(element, order) {
        // Generate a unique ID for the post if it doesn't have one
        if (!element.id) {
            element.id = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // Check if post is deleted
        const isDeleted = element.classList.contains('bg-red-100') ||
                         element.querySelector('.bg-red-100') ||
                         (element.querySelector('.fc-red-400') &&
                          element.querySelector('.fc-red-400').textContent.includes('Deleted by'));

        // Extract author information
        let author = 'Unknown Author';
        const hiddenNameSpan = element.querySelector('.s-user-card--link [itemprop="name"]');
        if (hiddenNameSpan) {
            author = hiddenNameSpan.textContent.trim();
        }
        // Extract date information
        let date = 'Unknown Date';
        const dateSelectors = [
            'time',
            '.relativetime',
            '[title*="202"]',
            '[datetime]',
            '.s-prose time'
        ];

        for (const selector of dateSelectors) {
            const dateElement = element.querySelector(selector);
            if (dateElement) {
                date = dateElement.getAttribute('title') ||
                       dateElement.getAttribute('datetime') ||
                       dateElement.textContent.trim();
                if (date && date !== 'Unknown Date') {
                    break;
                }
            }
        }

        // Extract post preview (doesn't work properly for deleted posts)
        let preview = '';
        const contentSelectors = [
            '.js-discussion-comment .s-prose',
            '.js-discussion-comment p',
            '.js-discussion-comment div:not(.deletion-controls)',
            '.s-prose p',
            '.s-prose'
        ];

        for (const selector of contentSelectors) {
            const contentElement = element.querySelector(selector);
            if (contentElement && !contentElement.classList.contains('deletion-controls')) {
                const textContent = contentElement.textContent.trim();
                if (textContent && textContent.length > 10) {
                    preview = textContent.substring(0, 80) + (textContent.length > 80 ? '...' : '');
                    break;
                }
            }
        }

        return {
            id: element.id,
            element: element,
            author: author,
            date: date,
            preview: preview || 'No preview available',
            isDeleted: isDeleted,
            order: order
        };
    }

    function createNavigationMenu() {
        // Remove existing menu if any
        if (navigationMenu) {
            navigationMenu.remove();
        }

        navigationMenu = document.createElement('div');
        navigationMenu.className = 'post-navigation';

        const header = document.createElement('div');
        header.className = 'nav-header';

        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.gap = '8px';

        const title = document.createElement('span');
        title.className = 'nav-title';
        title.textContent = 'Posts';

        const count = document.createElement('span');
        count.className = 'nav-count';
        count.textContent = allPosts.length.toString();

        const arrow = document.createElement('span');
        arrow.className = 'nav-arrow';
        arrow.innerHTML = '▼';

        titleContainer.appendChild(title);
        titleContainer.appendChild(count);
        header.appendChild(titleContainer);
        header.appendChild(arrow);

        const content = document.createElement('div');
        content.className = 'nav-content';

        // Add posts to the menu
        allPosts.forEach((post, index) => {
            const item = document.createElement('div');
            item.className = `nav-item ${post.isDeleted ? 'deleted' : ''} ${post.isReply ? 'reply' : ''}`;

            const postInfo = document.createElement('div');
            postInfo.className = 'post-info';

            const authorLine = document.createElement('div');
            authorLine.style.display = 'flex';
            authorLine.style.alignItems = 'center';
            authorLine.style.justifyContent = 'space-between';

            const author = document.createElement('span');
            author.className = 'post-author';
            author.textContent = `${post.isReply ? '↳ ' : ''}${post.author}`;

            const status = document.createElement('span');
            status.className = 'post-status';

            if (post.isDeleted) {
                status.className += ' status-deleted';
            } else if (viewedPosts.has(post.id)) {
                status.className += ' status-viewed';
            } else {
                status.className += ' status-normal';
            }
            //status.textContent = post.isDeleted ? 'DELETED' : 'ACTIVE';

            const dateSpan = document.createElement('span');
            dateSpan.className = 'post-date';
            dateSpan.textContent = post.date;

            const previewSpan = document.createElement('span');
            previewSpan.className = 'post-preview';
            previewSpan.textContent = post.preview;

            authorLine.appendChild(author);
            authorLine.appendChild(status);
            postInfo.appendChild(authorLine);
            postInfo.appendChild(dateSpan);
            postInfo.appendChild(previewSpan);
            item.appendChild(postInfo);

            // Add click handler to navigate to post
            item.addEventListener('click', () => {
                const targetElement = document.getElementById(post.id);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                    // Highlight the post briefly
                    targetElement.style.transition = 'background-color 0.3s ease';
                    targetElement.style.backgroundColor = '#fef3cd';
                    setTimeout(() => {
                        targetElement.style.backgroundColor = '';
                    }, 2000);
                }
            });

            content.appendChild(item);
        });

        // Add toggle functionality for the menu
        let isExpanded = false;
        header.addEventListener('click', () => {
            isExpanded = !isExpanded;
            content.classList.toggle('expanded', isExpanded);
            arrow.classList.toggle('expanded', isExpanded);
        });

        navigationMenu.appendChild(header);
        navigationMenu.appendChild(content);
        document.body.appendChild(navigationMenu);

        console.log('Challenge Navigator: Navigation menu created with', allPosts.length, 'posts');
    }

    function updateNavigationMenu() {
        allPosts = findAllPosts();
        createNavigationMenu();
    }

    function createDeletionControls(deletionText, toggleButton) {
        const controls = document.createElement('div');
        controls.className = 'deletion-controls';

        const info = document.createElement('div');
        info.className = 'deletion-info';
        info.innerHTML = `
            <span class="deletion-icon">🗑️</span>
            <span>${deletionText}</span>
        `;

        controls.appendChild(info);
        controls.appendChild(toggleButton);

        return controls;
    }

    function createViewedControls(toggleButton, author, date) {
        const controls = document.createElement('div');
        controls.className = 'viewed-controls';

        const info = document.createElement('div');
        info.className = 'viewed-info';
        info.innerHTML = `
        <span class="viewed-icon">👁️‍🗨️</span>
        <span>Posted by ${author} ${date}</span>
    `;

        controls.appendChild(info);
        controls.appendChild(toggleButton);

        return controls;
    }

    function addPostCheckbox(postElement) {
        // Skip if checkbox already exists
        if (postElement.querySelector('.post-checkbox-container')) {
            return;
        }

        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'post-checkbox-container';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'post-checkbox';
        checkbox.id = `viewed-checkbox-${postElement.id}`;
        checkbox.checked = viewedPosts.has(postElement.id);
        checkbox.title = 'Mark as viewed';

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.className = 'post-checkbox-label';
        label.textContent = 'Viewed:';
        checkboxContainer.appendChild(label);
        checkboxContainer.appendChild(checkbox);

        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                viewedPosts.add(postElement.id);
                collapseViewedPost(postElement);
            } else {
                viewedPosts.delete(postElement.id);
                expandViewedPost(postElement);
            }
            saveViewedPosts();
        });

        checkboxContainer.appendChild(checkbox);

        // Find the voting section and add checkbox below it
        const votingSection = postElement.querySelector('.d-inline-flex.ai-center');
        if (votingSection) {
            votingSection.appendChild(checkboxContainer);
        } else {
            // Fallback: add to comment container
            const commentContainer = postElement.querySelector('.js-discussion-comment');
            if (commentContainer) {
                commentContainer.appendChild(checkboxContainer);
            }
        }
    }

    function collapseViewedPost(postElement) {
        const commentContainer = postElement.querySelector('.js-discussion-comment');
        if (!commentContainer) {
            return;
        }

        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'expand-toggle';
        toggleButton.textContent = 'Show';
        toggleButton.setAttribute('aria-label', 'Show viewed post');

        // Get author and date
        const postInfo = extractPostInfo(postElement, 0); // order doesn't matter here
        const author = postInfo.author;
        const date = postInfo.date;

        // Create viewed controls
        const viewedControls = createViewedControls(toggleButton, author, date);

        // Insert controls at the beginning of the comment container
        commentContainer.insertBefore(viewedControls, commentContainer.firstChild);

        // Collapse the post
        postElement.classList.add('viewed-post-collapsed');

        // Add toggle functionality
        let isCollapsed = true;
        toggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            isCollapsed = !isCollapsed;

            if (isCollapsed) {
                postElement.classList.add('viewed-post-collapsed');
                toggleButton.textContent = 'Show';
                toggleButton.setAttribute('aria-label', 'Show viewed post');
            } else {
                postElement.classList.remove('viewed-post-collapsed');
                toggleButton.textContent = 'Hide';
                toggleButton.setAttribute('aria-label', 'Hide viewed post');
            }
        });
    }

    function expandViewedPost(postElement) {
        const viewedControls = postElement.querySelector('.viewed-controls');
        if (viewedControls) {
            viewedControls.remove();
        }
        postElement.classList.remove('viewed-post-collapsed');
        saveViewedPosts();
    }

    function collapseDeletedPost(postElement) {

        // Skip if already processed
        if (postElement.querySelector('.deletion-controls') || postElement.querySelector('.viewed-controls')) {
            return;
        }

        // Find deletion information
        let deletionText = 'Deleted post';
        const deletionIndicator = postElement.querySelector('.fc-red-400');
        if (deletionIndicator) {
            deletionText = deletionIndicator.textContent.trim();
        }

        // Find the discussion comment container
        const commentContainer = postElement.querySelector('.js-discussion-comment');
        if (!commentContainer) {
            return;
        }

        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'collapse-toggle';
        toggleButton.textContent = 'Show';
        toggleButton.setAttribute('aria-label', 'Show deleted post');

        // Create deletion controls
        const deletionControls = createDeletionControls(deletionText, toggleButton);

        // Insert controls at the beginning of the comment container
        commentContainer.insertBefore(deletionControls, commentContainer.firstChild);

        // Initially collapse the post
        postElement.classList.add('deleted-post-collapsed');

        // Add toggle functionality
        let isCollapsed = true;
        toggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            isCollapsed = !isCollapsed;

            if (isCollapsed) {
                postElement.classList.add('deleted-post-collapsed');
                toggleButton.textContent = 'Show';
                toggleButton.setAttribute('aria-label', 'Show deleted post');
            } else {
                postElement.classList.remove('deleted-post-collapsed');
                toggleButton.textContent = 'Hide';
                toggleButton.setAttribute('aria-label', 'Hide deleted post');
            }
        });
    }

    function processAllPosts() {
        const deletedPosts = findDeletedPosts();
        const allPostElements = document.querySelectorAll('.js-reply:not(.js-reply .js-reply)');

        // Process deleted posts (always collapsed by default)
        deletedPosts.forEach((post, index) => {
            collapseDeletedPost(post);
        });

        // Add checkboxes to all posts and handle viewed posts
        allPostElements.forEach(postElement => {
            // Check if THIS specific post element is in the deleted posts list
            const deletedPosts = findDeletedPosts();
            const isDeleted = deletedPosts.includes(postElement);

            // Add checkbox to non-deleted posts
            if (!isDeleted) {
                addPostCheckbox(postElement);

                // Collapse if marked as viewed
                if (viewedPosts.has(postElement.id)) {
                    collapseViewedPost(postElement);
                }
            }
        });
    }
    function addGlobalToggles() {
    // Remove existing toggles if any
    const existingViewed = document.querySelector('.global-toggle-viewed');
    if (existingViewed) existingViewed.remove();

    // Global toggle for viewed posts
    const globalToggleViewed = document.createElement('button');
    globalToggleViewed.className = 'global-toggle-viewed';
    globalToggleViewed.textContent = 'Expand All Viewed';
    globalToggleViewed.title = 'Show/Hide all viewed posts';

    globalToggleViewed.addEventListener('click', function() {
        const allViewedToggleButtons = document.querySelectorAll('.expand-toggle');
        const collapsedViewedPosts = document.querySelectorAll('.viewed-post-collapsed');
        const expandedViewedPosts = document.querySelectorAll('.js-reply:has(.viewed-controls):not(.viewed-post-collapsed)');


        const shouldExpand = false 

        allViewedToggleButtons.forEach(btn => {
            const post = btn.closest('.js-reply');
            const isCurrentlyCollapsed = post && post.classList.contains('viewed-post-collapsed');

            // Click button if state doesn't match desired state
            if ((shouldExpand && isCurrentlyCollapsed) || (!shouldExpand && !isCurrentlyCollapsed)) {
                btn.click();
            }
        });

        // Update button text
        globalToggleViewed.textContent = shouldExpand ? 'Collapse All Viewed' : 'Expand All Viewed';
    });

    document.body.appendChild(globalToggleViewed);
}

    // Debug function to inspect the page structure
    function debugPageStructure() {
        console.log('=== Challenge Navigator ===');
        console.log('=== DEBUG INFO ===');
        console.log('Total .js-reply elements:', document.querySelectorAll('.js-reply').length);
        console.log('Total .bg-red-100 elements:', document.querySelectorAll('.bg-red-100').length);
        console.log('Total .fc-red-400 elements:', document.querySelectorAll('.fc-red-400').length);

        const sampleDeleted = document.querySelector('.bg-red-100');
        if (sampleDeleted) {
            console.log('Sample deleted post structure:', sampleDeleted.outerHTML.substring(0, 500));
        }

        // List all deleted posts 
        document.querySelectorAll('.fc-red-400').forEach((el, i) => {
            if (el.textContent.includes('Deleted by')) {
                console.log(`Deleted post ${i + 1}:`, el.textContent);
            }
        });
    }

    // Main execution
    function init() {
        console.log('Challenge Navigator: Initializing...');

        // Debug the page structure
        //debugPageStructure();

        // Process existing posts
        processAllPosts();

        // Add global toggle
        addGlobalToggles();

        // Create navigation menu
        updateNavigationMenu();

        // Watch for dynamic content
        const observer = new MutationObserver(function(mutations) {
            let shouldProcess = false;

            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList && (node.classList.contains('js-reply') || node.classList.contains('bg-red-100'))) {
                                shouldProcess = true;
                            } else if (node.querySelector && (node.querySelector('.js-reply') || node.querySelector('.bg-red-100'))) {
                                shouldProcess = true;
                            }
                        }
                    });
                }
            });

            if (shouldProcess) {
                console.log('New content detected, reprocessing...');
                setTimeout(() => {
                    processAllPosts();
                    updateNavigationMenu();
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

})();
