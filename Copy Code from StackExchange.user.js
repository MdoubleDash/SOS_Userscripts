// ==UserScript==
// @name         Copy Code from StackExchange
// @namespace    https://github.com/MdoubleDash
// @version      1.0
// @description  Add a copy button for code sections on StackExchange sites with source attribution.
// @source       Basic version adapted from kpym's gist (https://gist.github.com/kpym/30d90be41ab5c248cdf7)
// @author       MDoubleDash (@M--)
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.askubuntu.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.mathoverflow.net/*
// @downloadURL  https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Copy%20Code%20from%20StackExchange.user.js
// @updateURL    https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Copy%20Code%20from%20StackExchange.user.js
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.11/clipboard.min.js
// ==/UserScript==
/* jshint -W097 */
'use strict';

// Configuration
const INCLUDE_ATTRIBUTION = true; // Set to false to disable attribution headers

// ------------------------------------------
// CSS part injected in the page
GM_addStyle(`
.precontainer {
    position: relative;
}

pre > code {
    white-space: pre;
}

.copy-btn {
    background: #f8f9fa;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    color: #555;
    cursor: pointer;
    font-size: 14px;
    height: 28px;
    margin: 0;
    opacity: 0;
    padding: 4px 8px;
    position: absolute;
    right: 8px;
    top: 8px;
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
    width: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
}

pre:hover > .copy-btn {
    opacity: 1;
}

.copy-btn:hover {
    background: #e9ecef;
    box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
}

.copy-btn svg {
    height: 16px;
    width: 16px;
    fill: currentColor;
}

.copy-btn.success {
    background: #e7f5e7;
    color: #28a745;
}

.copy-btn.error {
    background: #f8d7da;
    color: #dc3545;
}

/* Dark mode support for sites that have it */
.theme-dark pre > .copy-btn {
    background: #2d3748;
    color: #cbd5e0;
}
.theme-dark pre:hover > .copy-btn:hover {
    background: #4a5568;
}
.theme-dark .copy-btn.success {
    background: #285e28;
    color: #9ae6b4;
}
.theme-dark .copy-btn.error {
    background: #742a2a;
    color: #feb2b2;
}
`);

// SVG icons
const copyIcon = `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
const checkIcon = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
const errorIcon = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;

// Function to get the current license version from the page
function getLicenseVersion(postContainer) {
    // First try to find license info in the post's share dialog or nearby
    const licenseLink = postContainer?.querySelector('a[href*="creativecommons.org"]') || 
                       document.querySelector('a[href*="creativecommons.org"]');
    if (licenseLink) {
        const href = licenseLink.href;
        if (href.includes('4.0')) return '4.0';
        if (href.includes('3.0')) return '3.0';
        if (href.includes('2.5')) return '2.5';
    }
    // Default to 4.0 for newer SE sites
    return '4.0';
}

// Function to get post information for a code block
function getPostInfo(codeBlock) {
    // Find the closest answer or question container
    const postContainer = codeBlock.closest('.answer, .question, [data-answerid], [data-questionid]');
    
    let postId = null;
    let author = 'Unknown User';
    let postUrl = window.location.href;
    
    if (postContainer) {
        // Get post ID
        const answerIdAttr = postContainer.getAttribute('data-answerid');
        const questionIdAttr = postContainer.getAttribute('data-questionid');
        
        if (answerIdAttr) {
            postId = answerIdAttr;
            // Create answer URL
            const questionMatch = window.location.pathname.match(/\/questions\/(\d+)/);
            if (questionMatch) {
                postUrl = `${window.location.origin}/a/${postId}`;
            }
        } else if (questionIdAttr) {
            postId = questionIdAttr;
            postUrl = `${window.location.origin}/q/${postId}`;
        }
        
        // Check for community wiki first
        const communityWiki = postContainer.querySelector('.community-wiki');
        if (communityWiki) {
            // For Community Wiki, look for the username link (not the revision history link)
            // Look for a link to /users/ in the same user-info container as the community wiki indicator
            const cwUserInfo = communityWiki.closest('.user-info, .post-signature');
            if (cwUserInfo) {
                const userLink = cwUserInfo.querySelector('a[href*="/users/"]');
                if (userLink && userLink.textContent.trim() && !userLink.href.includes('/revisions')) {
                    author = `Community Wiki (${userLink.textContent.trim()})`;
                } else {
                    author = 'Community Wiki';
                }
            } else {
                author = 'Community Wiki';
            }
        } else {
            // First, try to find active user links
            const userSelectors = [
                '.post-signature .user-details a[href*="/users/"]',
                '.owner .user-details a[href*="/users/"]',
                '.user-info .user-details a[href*="/users/"]',
                '.user-details a[href*="/users/"]'
            ];
            
            for (const selector of userSelectors) {
                const userLink = postContainer.querySelector(selector);
                if (userLink && userLink.textContent.trim() && 
                    !userLink.textContent.includes('edited') && 
                    !userLink.closest('.user-action-time')) {
                    author = userLink.textContent.trim();
                    break;
                }
            }
            
            // If no active user found, look for deleted users
            if (author === 'Unknown User') {
                // Look for deleted users in post signature areas
                const signatureSelectors = [
                    '.post-signature .user-details',
                    '.owner .user-details', 
                    '.user-info .user-details'
                ];
                
                for (const selector of signatureSelectors) {
                    const userDetails = postContainer.querySelector(selector);
                    if (userDetails) {
                        // Try to get the itemprop="name" content first (most reliable)
                        const metaName = userDetails.querySelector('meta[itemprop="name"]');
                        if (metaName && metaName.getAttribute('content')) {
                            const nameContent = metaName.getAttribute('content');
                            if (nameContent.match(/^user\d+$/)) {
                                author = nameContent;
                                break;
                            }
                        }
                        
                        // Fallback: look for text content that matches user pattern
                        const textContent = userDetails.textContent.trim();
                        const lines = textContent.split('\n').map(line => line.trim()).filter(line => line);
                        for (const line of lines) {
                            if (line.match(/^user\d+$/)) {
                                author = line;
                                break;
                            }
                        }
                        if (author !== 'Unknown User') break;
                    }
                }
            }
        }
    }
    
    return { postId, author, postUrl };
}

// Function to create attribution header
function createAttribution(codeBlock) {
    const { postId, author, postUrl } = getPostInfo(codeBlock);
    const postContainer = codeBlock.closest('.answer, .question, [data-answerid], [data-questionid]');
    const licenseVersion = getLicenseVersion(postContainer);
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // For Community Wiki posts, don't use "Posted by" prefix
    const authorLine = author.startsWith('Community Wiki') ? author : `Posted by ${author}`;
    
    return `>>>===========================================================<<<
Source - ${postUrl}
${authorLine}
Retrieved ${currentDate}, License - CC-BY-SA ${licenseVersion}
>>>===========================================================<<<

`;
}

// Wait for the page to fully load and add copy button to code blocks
window.addEventListener('load', function() {
    document.querySelectorAll('pre > code').forEach(function(codeBlock) {
        const button = document.createElement('span');
        button.className = 'copy-btn';
        button.innerHTML = copyIcon;
        button.setAttribute('data-clipboard-target', '');
        button.setAttribute('aria-label', 'Copy code');
        button.setAttribute('title', 'Copy code');

        const pre = codeBlock.parentNode;
        pre.insertBefore(button, codeBlock);

        if (!pre.parentNode.classList.contains('precontainer')) {
            const container = document.createElement('div');
            container.className = 'precontainer';
            pre.parentNode.insertBefore(container, pre);
            container.appendChild(pre);
        }
    });

    // Initialize clipboard.js
    const clipboard = new ClipboardJS('.copy-btn', {
        text: function(trigger) {
            const codeBlock = trigger.nextElementSibling;
            const codeContent = codeBlock.textContent;
            
            if (INCLUDE_ATTRIBUTION) {
                const attribution = createAttribution(codeBlock);
                return attribution + codeContent;
            } else {
                return codeContent;
            }
        }
    });

    // Success handler - reset after 2 seconds
    clipboard.on('success', function(e) {
        e.trigger.innerHTML = checkIcon;
        e.trigger.classList.add('success');

        setTimeout(function() {
            e.trigger.innerHTML = copyIcon;
            e.trigger.classList.remove('success');
        }, 2000);

        e.clearSelection();
    });

    // Error handler - reset after 2 seconds
    clipboard.on('error', function(e) {
        e.trigger.innerHTML = errorIcon;
        e.trigger.classList.add('error');

        setTimeout(function() {
            e.trigger.innerHTML = copyIcon;
            e.trigger.classList.remove('error');
        }, 2000);
    });
});
