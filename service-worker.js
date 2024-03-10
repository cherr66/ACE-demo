// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).
// It would correspond to the background script in chrome extensions v2.

// importScripts('service-worker-utils.js')
const targetWebSitesURLs = [
    /^https:\/\/itch\.io\//
];
const targetGameURLs = [
    // /^https:\/\/.+\.itch\.io\/.+/,
    // https://jedb.itch.io/invitationem
    // /^https:\/\/jedb\.itch\.io\/invitationem$/,
    /https:\/\/html-classic\.itch\.zone\/html\/[\/\w.+]+\/[^\/]+\.html/,
];


chrome.action.onClicked.addListener(async function (tab){
    await chrome.tabs.sendMessage(tab.id, {message: "toggle popup"},
        (r)=>{console.log(r);});
});


chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");
});

chrome.webNavigation.onCompleted.addListener(async function(details)  {
    if(targetWebSitesURLs.some((urlPattern) => details.url.match(urlPattern))){
        // TODO the content.js can run in certain frame, try it
        await chrome.scripting.executeScript({
            target: {tabId: details.tabId},
            files: ['content.js', 'content-utils.js']
        });
        // TODO: OR, check if possible game content exists (in content.js, should not be in background.js),
        //  if so, suggest for redirecting
        // const viewHtmlGame = document.querySelector('[id^="view_html_game_"]');
        // const iframe = viewHtmlGame.querySelector('[id^="html_embed_"] .game_frame iframe');
    } else if(targetGameURLs.some((urlPattern) => details.url.match(urlPattern))){
        await chrome.scripting.executeScript({
            target: {tabId: details.tabId},
            files: ['content-utils.js', 'content-magnifier.js', 'content-interactiveHints.js', 'content.js']
        });
    }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.code === "GET_CAPTURED_TAB"){
        const tabId = sender.tab.id;
        chrome.tabs.captureVisibleTab({ format: "png" }, async function (image_url) {

            chrome.tabs.getZoom(tabId,  function (zoomFactor) {
                 chrome.tabs.sendMessage(tabId, {
                    code: "GET_CAPTURED_TAB_RESPONSE",
                    data_url: image_url, zoom: zoomFactor,
                     // x: x
                });
            });
        });
        sendResponse({code:"SUCCESS"});
    }
});


