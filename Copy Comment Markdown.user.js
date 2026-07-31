// ==UserScript==
// @name        Copy Comment Markdown with Metadata
// @description Copies comment raw markdown plus author and date
// @namespace   https://github.com/MdoubleDash
// @version     1.0
// @author      MDoubleDash (@M--)
// @run-at      document-start
// @match       https://*.stackexchange.com/*
// @match       https://*.superuser.com/*
// @match       https://*.stackoverflow.com/*
// @match       https://*.mathoverflow.net/*
// @match       https://*.serverfault.com/*
// @match       https://*.askubuntu.com/*
// @match       https://stackapps.com/*
// @exclude     https://api.stackexchange.com/*
// @exclude     https://data.stackexchange.com/*
// @exclude     https://openid.stackexchange.com/*
// @exclude     https://contests.stackoverflow.com/*
// @downloadURL https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Copy%20Comment%20Markdown.user.js
// @updateURL   https://github.com/MdoubleDash/SOS_Userscripts/raw/main/Copy%20Comment%20Markdown.user.js
// @grant       none
// ==/UserScript==

/*jshint curly:false*/

const processNode = node => {
    if (!node?.matches('.js-comment')) return;
    if (node.querySelector('.--rmd-button')) return;

    const child = node.querySelector('.comment-date');
    if (!child) return;

    child.insertAdjacentHTML(
        'afterend',
        `<button type="button" class="--rmd-button s-btn s-btn__link" style="font-variant: small-caps; margin-left: 4px;">md+</button>`
    );
};

const processUnder = node => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    processNode(node);
    for (const subnode of node.querySelectorAll('.js-comment')) processNode(subnode);
};

// Observer for dynamic content
new MutationObserver(mutations => {
    for (const mut of mutations) {
        if (mut.type === 'childList') {
            mut.addedNodes.forEach(processUnder);
        }
    }
}).observe(document, { childList: true, subtree: true });

document.addEventListener('click', (ev) => {
    if (!ev.target.matches('.--rmd-button')) return;

    const commentNode = ev.target.closest('.js-comment');
    const { commentId } = commentNode.dataset;

    // Get author name
    const authorElem = commentNode.querySelector('.comment-user');
    const authorName = authorElem ? authorElem.textContent.trim() : "Unknown";

    // Get date
    const dateElem = commentNode.querySelector('[itemprop="datePublished"]');
    const dateText = dateElem ? dateElem.textContent.trim() :
                     commentNode.querySelector('.relativetime-clean')?.title || "Unknown Date";

    (async () => {
        const response = await fetch(
            `https://api.stackexchange.com/2.3/comments/${commentId}?${
            new URLSearchParams({
                'site': location.host,
                'filter': 'do(JZxI-6d1J5m2-r', // Includes body_markdown
            })}`);

        const responseJson = await response.json();
        const rawBody = responseJson.items[0].body_markdown;

        // Format the markdown string
        const finalMarkdown = `> ${rawBody}\n> — **${authorName}**, *${dateText}*`;

        // Copy to clipboard
        try {
            await navigator.clipboard.writeText(finalMarkdown);
            const originalText = ev.target.innerText;
            ev.target.innerText = "Copied!";
            setTimeout(() => ev.target.innerText = originalText, 1500);
        } catch (err) {
            console.error('Failed to copy!', err);
            alert("Markdown generated but clipboard access failed. See console.");
            console.log(finalMarkdown);
        }
    })().catch(e => alert(`[Error] ${e}`));
});
