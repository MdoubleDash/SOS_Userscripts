// ==UserScript==
// @name         Dupe Redirect Warning
// @namespace    https://github.com/MdoubleDash
// @version      0.5.0
// @description  Warns when a post/comment draft links to a question closed as duplicate with no answers and offers to add ?noredirect=1
// @author       MDoubleDash (@M--)
// @match        *://*.stackoverflow.com/*
// @match        *://*.stackexchange.com/*
// @match        *://*.superuser.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.askubuntu.com/*
// @match        *://*.mathoverflow.net/*
// @exclude      *://chat.stackoverflow.com/*
// @exclude      *://chat.stackexchange.com/*
// @exclude      *://chat.meta.stackexchange.com/*
// @exclude      *://api.stackexchange.com/*
// @exclude      *://data.stackexchange.com/*
// @exclude      *://winterbash*.stackexchange.com/*
// @exclude      *://area51.stackexchange.com/*
// @grant        none
// ==/UserScript==

/* globals $ */

(function () {
    'use strict';

    // ---------------------------------------------------------------------------
    // SVG icons
    // https://www.svgviewer.dev
    //
    // Toolbar icon:
    //   License: MIT. Made by Bliss Design System:
    //   https://gitlab.com/bliss-design-system/iconsets
    //
    // Warning icon (possibly deleted):
    //   License: MIT. Made by joypixels:
    //   https://github.com/joypixels/emojione
    //
    // No-entry icon (confirmed redirect):
    //   License: CC Attribution. Made by Shannon E. Thomas:
    //   https://dribbble.com/shannonethomas
    // ---------------------------------------------------------------------------
    const SVG_TOOLBAR = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="display:block" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 7.375C7.5 6.33947 8.33947 5.5 9.375 5.5C10.4105 5.5 11.25 6.33947 11.25 7.375V16.625C11.25 18.489 12.761 20 14.625 20C16.489 20 18 18.489 18 16.625V11.8107L19.2197 13.0303L20.2803 11.9697L17.25 8.93934L14.2197 11.9697L15.2803 13.0303L16.5 11.8107V16.625C16.5 17.6605 15.6605 18.5 14.625 18.5C13.5895 18.5 12.75 17.6605 12.75 16.625V7.375C12.75 5.51104 11.239 4 9.375 4C7.51104 4 6 5.51104 6 7.375V9.5H4V15H9.5V9.5H7.5V7.375ZM5.5 11V13.5H8V11H5.5Z" fill="currentColor"/></svg>';

    const SVG_WARNING = '<svg width="14" height="14" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" preserveAspectRatio="xMidYMid meet"><path d="M5.9 62c-3.3 0-4.8-2.4-3.3-5.3L29.3 4.2c1.5-2.9 3.9-2.9 5.4 0l26.7 52.5c1.5 2.9 0 5.3-3.3 5.3H5.9z" fill="#ffce31"/><path d="M27.8 23.6l2.8 18.5c.3 1.8 2.6 1.8 2.9 0l2.7-18.5c.5-7.2-8.9-7.2-8.4 0" fill="#231f20"/><circle cx="32" cy="49.6" r="4.2" fill="#231f20"/></svg>';

    const SVG_NOENTRY = '<svg width="14" height="14" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon points="10.408,29.5 2.5,21.592 2.5,10.408 10.408,2.5 21.592,2.5 29.5,10.408 29.5,21.592 21.592,29.5" fill="#CC4121"/><path d="M21.414,12.707L18.121,16l3.293,3.293l-2.121,2.121L16,18.121l-3.293,3.293l-2.121-2.121L13.879,16l-3.293-3.293l2.121-2.121L16,13.879l3.293-3.293L21.414,12.707z M21.592,2.5H10.408L2.5,10.408v11.184l7.908,7.908h11.184l7.908-7.908V10.408L21.592,2.5z M28,20.97L20.97,28H11.03L4,20.97v-9.941L11.03,4h9.941L28,11.029V20.97z" fill="#FFFAEE"/><path d="M19.293,9.879L16,13.172l-3.293-3.293l-2.828,2.828L13.172,16l-3.293,3.293l2.828,2.828L16,18.828l3.293,3.293l2.828-2.828L18.828,16l3.293-3.293L19.293,9.879z M17.414,16l3.293,3.293l-1.414,1.414L16,17.414l-3.293,3.293l-1.414-1.414L14.586,16l-3.293-3.293l1.414-1.414L16,14.586l3.293-3.293l1.414,1.414L17.414,16z M21.799,2H10.201L2,10.201v11.598L10.201,30h11.598L30,21.799V10.201L21.799,2z M29,21.385L21.385,29h-10.77L3,21.385v-10.77L10.615,3h10.77L29,10.615V21.385z" fill="#231F20"/></svg>';


    const style = document.createElement('style');
    style.textContent = '.se-dupe-check-li.active { background: var(--black-300) !important; border-radius: 3px; }';
    document.head.appendChild(style);

    // API key - generated via https://stackapps.com/apps/oauth
    // Provides 10,000 requests/day isolated to this script.
    const API_KEY = 'rl_RwdMLasstpy4anzKPbcGXBEvX';

    const API_BASE = 'https://api.stackexchange.com/2.3';

    // Baked-in filters created via /filter/create - immutable and non-expiring.
    // answers   filter: .items + answer.answer_id + answer.question_id
    // questions filter: .items + question.question_id + question.answer_count
    //                   + question.closed_reason
    const FILTER_ANSWERS   = '!9WdFOb2CvhfS';
    const FILTER_QUESTIONS = '!10dDZ8hsMmTnRgmD';

    // Minimum ms between any two consecutive API calls.
    const API_CALL_DELAY_MS = 150;

    // Session caches - persist until page reload.
    // answerCache:   Map<"site:answerId", questionId | null>
    //   null  = API succeeded but answer absent (deleted / invisible)
    // questionCache: Map<"site:questionId", true | false | "missing">
    //   true    = confirmed redirect (closed dupe, 0 answers)
    //   false   = confirmed safe
    //   "missing" = API succeeded but question absent (possibly deleted)
    // IDs are only cached after a successful API response; a thrown error
    // leaves them uncached so the next button click will retry them.
    const answerCache   = new Map();
    const questionCache = new Map();

    // Throttle state
    let lastCallTime = 0;
    const backoffUntil = new Map();

    function methodOf(path) {
        return path.replace(/^\//, '').split('/')[0];
    }

    async function throttle(path) {
        const bo     = backoffUntil.get(methodOf(path)) || 0;
        const boWait = Math.max(0, bo - Date.now());
        if (boWait > 0) {
            console.debug(`[SE dupe check] honouring backoff on ${methodOf(path)}: ${boWait}ms`);
            await new Promise(r => setTimeout(r, boWait));
        }
        const gap = Math.max(0, API_CALL_DELAY_MS - (Date.now() - lastCallTime));
        lastCallTime = Date.now() + gap;
        if (gap > 0) await new Promise(r => setTimeout(r, gap));
    }

    // SE link pattern - captures:
    // group 1: hostname   e.g. stackoverflow.com
    // group 2: type       questions | q | a
    // group 3: numeric id
    // group 4: rest of URL including any query string
    const SE_LINK_RE =
        /https?:\/\/((?:[a-z0-9-]+\.)*(?:stackoverflow|superuser|serverfault|askubuntu|mathoverflow)\.(?:com|net)|(?:[a-z0-9-]+\.)?stackexchange\.com)\/(?:(questions|q|a)\/(\d+))([/?][^\s)"']*)?/gi;

    function hostToSite(hostname) {
        return hostname.split(':')[0].toLowerCase().replace(/\.(com|net)$/, '');
    }

    function extractLinks(text) {
        const links = [];
        let m;
        SE_LINK_RE.lastIndex = 0;
        while ((m = SE_LINK_RE.exec(text)) !== null) {
            links.push({
                raw:           m[0],
                hostname:      m[1],
                type:          m[2],
                id:            parseInt(m[3], 10),
                hasNoredirect: m[0].includes('noredirect=1'),
            });
        }
        return links;
    }

    // Core API GET - uses jQuery $.get()
    // jQuery handles gzip decompression and cross-origin automatically.
    // Throttles before each call. Records backoff and quota from every response.
    // Throws on quota exhaustion, API errors, and network failures.
    async function apiGet(path) {
        await throttle(path);

        const sep = path.includes('?') ? '&' : '?';
        const url = API_BASE + path + sep + 'pagesize=100&key=' + encodeURIComponent(API_KEY);
        console.debug('[SE dupe check] GET', url);

        return new Promise((resolve, reject) => {
            $.get(url)
                .done(data => {
                    console.debug('[SE dupe check] response', JSON.stringify(data).slice(0, 300));

                    if (data.backoff) {
                        const method = methodOf(path);
                        backoffUntil.set(method, Date.now() + data.backoff * 1000);
                        console.debug(`[SE dupe check] backoff ${data.backoff}s on ${method}`);
                    }

                    if (data.quota_remaining != null) {
                        console.debug(
                            `[SE dupe check] quota: ${data.quota_remaining}` +
                            (data.quota_max != null ? `/${data.quota_max}` : '')
                        );
                    }

                    if (data.quota_remaining === 0) {
                        reject(new Error('Daily API quota exhausted. Requests will resume tomorrow.'));
                        return;
                    }

                    if (data.error_id) {
                        if (data.error_id === 503) {
                            backoffUntil.set(methodOf(path), Date.now() + 10_000);
                            reject(new Error(
                                'Stack Exchange API is temporarily unavailable. ' +
                                'Please wait a moment and try again.'
                            ));
                        } else {
                            reject(new Error(
                                `SE API error ${data.error_id} (${data.error_name}): ` +
                                data.error_message
                            ));
                        }
                        return;
                    }

                    resolve(data);
                })
                .fail((jqXHR, textStatus, errorThrown) => {
                    reject(new Error(`Request failed: ${textStatus} ${errorThrown}`.trim()));
                });
        });
    }

    // Resolve answer IDs -> question IDs, with session caching.
    // Only caches after a successful API call; thrown errors leave IDs uncached.
    async function resolveAnswers(answerIds, site) {
        const uncached = answerIds.filter(id => !answerCache.has(`${site}:${id}`));
        if (uncached.length) {
            const data = await apiGet(
                `/answers/${[...new Set(uncached)].join(';')}` +
                `?site=${encodeURIComponent(site)}&filter=${FILTER_ANSWERS}`
            );
            for (const item of (data.items || [])) {
                answerCache.set(`${site}:${item.answer_id}`, item.question_id);
            }
            // API call succeeded but these IDs were absent - cache as null
            for (const id of uncached) {
                if (!answerCache.has(`${site}:${id}`)) {
                    answerCache.set(`${site}:${id}`, null);
                }
            }
        }
        const map = new Map();
        for (const id of answerIds) {
            const qid = answerCache.get(`${site}:${id}`);
            if (qid != null) map.set(id, qid);
        }
        return map;
    }

    // Check question IDs for redirect condition, with session caching.
    // Returns two sets: redirecting (confirmed) and missing (possibly deleted).
    // Only caches after a successful API call; thrown errors leave IDs uncached.
    async function checkQuestions(questionIds, site) {
        const uncached = questionIds.filter(id => !questionCache.has(`${site}:${id}`));
        if (uncached.length) {
            const data = await apiGet(
                `/questions/${[...new Set(uncached)].join(';')}` +
                `?site=${encodeURIComponent(site)}&filter=${FILTER_QUESTIONS}`
            );
            for (const item of (data.items || [])) {
                questionCache.set(
                    `${site}:${item.question_id}`,
                    item.answer_count === 0 &&
                    typeof item.closed_reason === 'string' &&
                    item.closed_reason.toLowerCase().includes('duplicate')
                        ? true
                        : false
                );
            }
            // API call succeeded but these IDs were absent - possibly deleted
            for (const id of uncached) {
                if (!questionCache.has(`${site}:${id}`)) {
                    questionCache.set(`${site}:${id}`, 'missing');
                }
            }
        }
        const redirecting = new Set();
        const missing     = new Set();
        for (const id of questionIds) {
            const v = questionCache.get(`${site}:${id}`);
            if (v === true)      redirecting.add(id);
            else if (v === 'missing') missing.add(id);
        }
        return { redirecting, missing };
    }

    // Main check - returns array of result objects:
    // { raw, hostname, canonicalUrl, questionId, status }
    // status: "redirect" | "missing"
    async function checkDraft(text) {
        const links = extractLinks(text).filter(l => !l.hasNoredirect);
        if (!links.length) return [];

        const bySite = new Map();
        for (const link of links) {
            const site = hostToSite(link.hostname);
            if (!bySite.has(site)) bySite.set(site, { questions: [], answers: [], links: [] });
            const g = bySite.get(site);
            g.links.push(link);
            (link.type === 'a' ? g.answers : g.questions).push(link.id);
        }

        const results = [];
        for (const [site, group] of bySite) {
            const answerMap              = await resolveAnswers(group.answers, site);
            const allQIds                = [...new Set([...group.questions, ...answerMap.values()])];
            const { redirecting, missing } = await checkQuestions(allQIds, site);

            for (const link of group.links) {
                let questionId;
                if (link.type === 'a') {
                    questionId = answerMap.get(link.id);
                    if (questionId == null) continue;
                } else {
                    questionId = link.id;
                }

                const canonicalUrl = `https://${link.hostname}/questions/${questionId}?noredirect=1`;

                if (redirecting.has(questionId)) {
                    results.push({ raw: link.raw, hostname: link.hostname, canonicalUrl, questionId, status: 'redirect' });
                } else if (missing.has(questionId)) {
                    results.push({ raw: link.raw, hostname: link.hostname, canonicalUrl, questionId, status: 'missing' });
                }
            }
        }
        return results;
    }

    // Replace all occurrences of rawUrl in the textarea
    function replaceInTextarea(textarea, rawUrl, replacement) {
        const escaped = rawUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        textarea.value = textarea.value.replace(new RegExp(escaped, 'g'), replacement);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Build the results panel content
    function renderPanel(panel, textarea, results) {
        panel.innerHTML = '';

        if (!results.length) {
            const ok = document.createElement('span');
            ok.style.cssText = 'color:#3b7a57;';
            ok.textContent   = 'No redirect issues found.';
            panel.appendChild(ok);
        } else {
            const redirectCount = results.filter(r => r.status === 'redirect').length;
            const missingCount  = results.filter(r => r.status === 'missing').length;

            const parts = [];
            if (redirectCount) parts.push(`${redirectCount} link${redirectCount > 1 ? 's' : ''} will redirect anonymous users`);
            if (missingCount)  parts.push(`${missingCount} link${missingCount > 1 ? 's' : ''} may redirect (possibly deleted)`);

            const header = document.createElement('div');
            header.style.cssText = 'font-weight:bold; margin-bottom:4px;';
            header.textContent   = parts.join('; ') + ':';
            panel.appendChild(header);

            for (const item of results) {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; align-items:baseline; gap:8px; margin:3px 0; flex-wrap:nowrap;';

                const icon = document.createElement('span');
                icon.style.cssText    = 'flex-shrink:0; display:inline-flex; align-items:center;';
                icon.innerHTML        = item.status === 'redirect' ? SVG_NOENTRY : SVG_WARNING;

                const titleText = item.status === 'redirect'
                    ? 'This question is closed as a duplicate and has no answers. Anonymous users will be silently redirected to the duplicate target.'
                    : 'This question was not returned by the API - it may be deleted. If so, anonymous users may still be redirected.';

                const linkSpan = document.createElement('span');
                linkSpan.style.cssText = 'font-family:monospace; font-size:12px; color:#333; word-break:break-all; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap';
                linkSpan.textContent   = item.raw;
                linkSpan.title         = titleText;

                const fixBtn = document.createElement('button');
                fixBtn.type          = 'button';
                fixBtn.className     = 's-btn s-btn__sm s-btn__outlined';
                fixBtn.style.cssText = 'white-space:nowrap; flex-shrink:0;';
                fixBtn.textContent   = item.status === 'redirect' ? 'Replace with ?noredirect=1' : 'Add ?noredirect=1 anyway';
                fixBtn.addEventListener('click', () => {
                    replaceInTextarea(textarea, item.raw, item.canonicalUrl);
                    row.style.textDecoration = 'line-through';
                    row.style.opacity        = '0.5';
                    fixBtn.disabled          = true;
                    fixBtn.textContent       = 'Replaced';
                });

                row.appendChild(icon);
                row.appendChild(linkSpan);
                row.appendChild(fixBtn);
                panel.appendChild(row);
            }
        }

        // Attribution required by SE API Terms of Use (AFAICT)
        const attribution = document.createElement('div');
        attribution.style.cssText = 'margin-top:6px; font-size:11px; color:#6a737c;';
        attribution.textContent   = 'Data via Stack Exchange API';
        panel.appendChild(attribution);
    }

    // Inject a toolbar button (does not work for the new SO Ask Question)
    // below the editor. The button toggles: first click runs the check and shows
    // results; second click clears and deselects; subsequent clicks re-run.
    function injectUI(textarea, buttonRow, editorContainer) {
        if (buttonRow.querySelector('.se-dupe-check-li')) return;

        // Toolbar button
        const li = document.createElement('li');
        li.className    = 'wmd-button se-dupe-check-li';
        li.style.cssText = 'width:auto; height:40px; padding:0 3px; margin-left:30px; display:inline-flex; align-items:center; background-image:none; cursor:pointer; overflow:visible; vertical-align:middle';
        li.title        = 'Check links for duplicate redirects';

        li.innerHTML = SVG_TOOLBAR;
        const redoBtn = buttonRow.querySelector('[id^="wmd-redo-button"]');
        if (redoBtn) redoBtn.insertAdjacentElement('afterend', li);
        else buttonRow.appendChild(li);

        // Results panel - lives below the editor
        const panel = document.createElement('div');
        panel.className     = 'se-dupe-check-panel';
        panel.style.cssText = 'margin-top:6px; font-size:13px; display:none;';
        editorContainer.appendChild(panel);

        let active = false;

        li.addEventListener('click', async () => {
            if (active) {
                // Second click: deselect and hide panel
                active = false;
                li.classList.remove('active');
                panel.style.display = 'none';
                panel.innerHTML     = '';
                return;
            }

            // First click: select and run
            active = true;
            li.classList.add('active');
            panel.style.display = '';
            panel.innerHTML     = '<span style="color:#6a737c;">Checking...</span>';

            try {
                const results = await checkDraft(textarea.value);
                renderPanel(panel, textarea, results);
            } catch (err) {
                panel.innerHTML =
                    `<span style="color:#c0392b;">Error: ${err.message || err}</span>`;
                console.error('[SE dupe redirect check]', err);
                // On error, revert to deselected so user can click to retry
                active = false;
                li.style.background = '';
            }
        });
    }

    // Attach UI
    function attachToEditors() {
        document.querySelectorAll('ul.wmd-button-row').forEach(buttonRow => {
            if (buttonRow.querySelector('.se-dupe-check-li')) return;
            const editorContainer =
                buttonRow.closest('.post-editor') ||
                buttonRow.closest('form') ||
                buttonRow.parentElement;
            const textarea = editorContainer && editorContainer.querySelector('textarea.wmd-input');
            if (textarea) injectUI(textarea, buttonRow, editorContainer);
        });

        // Comment boxes
        document.querySelectorAll('textarea.js-comment-text-input').forEach(ta => {
            if (ta.dataset.dupeCheckInjected) return;
            ta.dataset.dupeCheckInjected = '1';

            const container =
                ta.closest('.js-comment-form-layout') ||
                ta.closest('form') ||
                ta.parentElement;
            if (!container) return;

            const btn = document.createElement('button');
            btn.type          = 'button';
            btn.className     = 'se-dupe-check-btn s-btn s-btn__sm';
            btn.style.cssText = 'margin-left:4px; vertical-align:middle;';
            btn.innerHTML     = SVG_TOOLBAR;
            btn.title         = 'Check links for duplicate redirects';

            const panel = document.createElement('div');
            panel.className     = 'se-dupe-check-panel';
            panel.style.cssText = 'margin-top:6px; font-size:13px; display:none;';

            // Insert button after the textarea
            ta.insertAdjacentElement('afterend', btn);
            btn.insertAdjacentElement('afterend', panel);

            let active = false;

            btn.addEventListener('click', async () => {
                if (active) {
                    active = false;
                    btn.classList.remove('is-selected');
                    panel.style.display = 'none';
                    panel.innerHTML     = '';
                    return;
                }

                active = true;
                btn.classList.add('is-selected');
                panel.style.display = '';
                panel.innerHTML     = '<span style="color:#6a737c;">Checking...</span>';

                try {
                    const results = await checkDraft(ta.value);
                    renderPanel(panel, ta, results);
                } catch (err) {
                    panel.innerHTML =
                        `<span style="color:#c0392b;">Error: ${err.message || err}</span>`;
                    console.error('[SE dupe redirect check]', err);
                    active = false;
                    btn.classList.remove('is-selected');
                }
            });
        });
    }

    new MutationObserver(() => attachToEditors())
        .observe(document.body, { childList: true, subtree: true });

    attachToEditors();
})();
