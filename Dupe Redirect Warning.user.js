// ==UserScript==
// @name         Dupe Redirect Warning
// @namespace    https://github.com/MdoubleDash
// @version      0.3.0
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
    // questionCache: Map<"site:questionId", boolean> - true if closed dupe with 0 answers
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
            console.debug(
                `[SE dupe check] honouring backoff on ${methodOf(path)}: ${boWait}ms`
            );
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

    // Core API GET
    async function apiGet(path) {
        await throttle(path);

        const sep = path.includes('?') ? '&' : '?';
        const url = API_BASE + path + sep + 'pagesize=100&key=' + encodeURIComponent(API_KEY);
        console.debug('[SE dupe check] GET', url);

        return new Promise((resolve, reject) => {
            $.get(url)
                .done(data => {
                    console.debug('[SE dupe check] response', JSON.stringify(data).slice(0, 300));

                    // Record backoff before checking errors
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
                        reject(new Error(
                            'Daily API quota exhausted. ' +
                            'Requests will resume tomorrow.'
                        ));
                        return;
                    }

                    if (data.error_id) {
                        if (data.error_id === 503) {
                            // temporarily_unavailable - treat as backoff
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
    // IDs absent from the response (deleted, invisible to <10k) cached as null.
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
                );
            }
            // Not returned = deleted/invisible -> cache as false, don't warn
            for (const id of uncached) {
                if (!questionCache.has(`${site}:${id}`)) {
                    questionCache.set(`${site}:${id}`, false);
                }
            }
        }
        const redirecting = new Set();
        for (const id of questionIds) {
            if (questionCache.get(`${site}:${id}`) === true) redirecting.add(id);
        }
        return redirecting;
    }

    // Main check - returns array of { raw, hostname, canonicalUrl, questionId }
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

        const flagged = [];
        for (const [site, group] of bySite) {
            const answerMap   = await resolveAnswers(group.answers, site);
            const allQIds     = [...new Set([...group.questions, ...answerMap.values()])];
            const redirecting = await checkQuestions(allQIds, site);

            for (const link of group.links) {
                let questionId;
                if (link.type === 'a') {
                    questionId = answerMap.get(link.id);
                    if (questionId == null) continue;
                } else {
                    questionId = link.id;
                }
                if (redirecting.has(questionId)) {
                    flagged.push({
                        raw:          link.raw,
                        hostname:     link.hostname,
                        canonicalUrl: `https://${link.hostname}/questions/${questionId}?noredirect=1`,
                        questionId,
                    });
                }
            }
        }
        return flagged;
    }

    // Replace all occurrences of rawUrl in the textarea
    function replaceInTextarea(textarea, rawUrl, replacement) {
        const escaped = rawUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        textarea.value = textarea.value.replace(new RegExp(escaped, 'g'), replacement);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Inject "Check links" button + results panel below an editor
    function injectUI(textarea, container) {
        if (container.querySelector('.se-dupe-check-btn')) return;

        const btn = document.createElement('button');
        btn.type          = 'button';
        btn.className     = 'se-dupe-check-btn s-btn s-btn__sm';
        btn.style.cssText = 'margin-top:6px;';
        btn.textContent   = 'Check links';

        const panel = document.createElement('div');
        panel.className     = 'se-dupe-check-panel';
        panel.style.cssText = 'margin-top:6px; font-size:13px;';

        container.appendChild(btn);
        container.appendChild(panel);

        btn.addEventListener('click', async () => {
            panel.innerHTML = '<span style="color:#6a737c;">Checking...</span>';
            btn.disabled = true;

            try {
                const flagged = await checkDraft(textarea.value);

                panel.innerHTML = '';

                if (!flagged.length) {
                    const ok = document.createElement('span');
                    ok.style.cssText = 'color:#3b7a57;';
                    ok.textContent   = 'No redirect issues found.';
                    panel.appendChild(ok);
                } else {
                    const header = document.createElement('div');
                    header.style.cssText = 'color:#c0392b; font-weight:bold; margin-bottom:4px;';
                    header.textContent =
                        `${flagged.length} link${flagged.length > 1 ? 's' : ''} ` +
                        `will redirect anonymous users:`;
                    panel.appendChild(header);

                    for (const item of flagged) {
                        const row = document.createElement('div');
                        row.style.cssText =
                            'display:flex; align-items:baseline; gap:8px; ' +
                            'margin:3px 0; flex-wrap:wrap;';

                        const linkSpan = document.createElement('span');
                        linkSpan.style.cssText =
                            'font-family:monospace; font-size:12px; ' +
                            'color:#333; word-break:break-all;';
                        linkSpan.textContent = item.raw;
                        linkSpan.title =
                            'This question is closed as a duplicate and has no answers. ' +
                            'Anonymous users (and users without an account on this site) ' +
                            'will be silently redirected to the duplicate target instead of ' +
                            'seeing this post.';

                        const fixBtn = document.createElement('button');
                        fixBtn.type          = 'button';
                        fixBtn.className     = 's-btn s-btn__sm s-btn__outlined';
                        fixBtn.style.cssText = 'white-space:nowrap; flex-shrink:0;';
                        fixBtn.textContent   = 'Replace with ?noredirect=1';
                        fixBtn.addEventListener('click', () => {
                            replaceInTextarea(textarea, item.raw, item.canonicalUrl);
                            row.style.textDecoration = 'line-through';
                            row.style.opacity        = '0.5';
                            fixBtn.disabled          = true;
                            fixBtn.textContent       = 'Replaced';
                        });

                        row.appendChild(linkSpan);
                        row.appendChild(fixBtn);
                        panel.appendChild(row);
                    }
                }

                // Attribution required by SE API Terms of Use
                const attribution = document.createElement('div');
                attribution.style.cssText = 'margin-top:6px; font-size:11px; color:#6a737c;';
                attribution.textContent   = 'Data via Stack Exchange API';
                panel.appendChild(attribution);

            } catch (err) {
                panel.innerHTML =
                    `<span style="color:#c0392b;">Error: ${err.message || err}</span>`;
                console.error('[SE dupe redirect check]', err);
            } finally {
                btn.disabled = false;
            }
        });
    }

    // Attach to all current and future editors
    function attachToEditors() {
        document.querySelectorAll(
            'textarea.wmd-input, textarea.js-comment-text-input'
        ).forEach(ta => {
            const container =
                ta.closest('.js-comment-form-layout') ||
                ta.closest('.post-editor') ||
                ta.closest('form') ||
                ta.parentElement;
            if (container) injectUI(ta, container);
        });
    }

    new MutationObserver(() => attachToEditors())
        .observe(document.body, { childList: true, subtree: true });

    attachToEditors();
})();
