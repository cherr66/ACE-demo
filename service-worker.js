// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).
// It would correspond to the background script in chrome extensions v2.

// importScripts('service-worker-utils.js')
let targetURL = /^https:\/\/itch\.io\//;
// todo change to compatible games
let targetGameURLs = [
    // /^https:\/\/.+\.itch\.io\/.+/,
    // https://jedb.itch.io/invitationem
    // /^https:\/\/jedb\.itch\.io\/invitationem$/,
    /https:\/\/html-classic\.itch\.zone\/html\/[\/\w.+]+\/[^\/]+\.html/,
]


chrome.action.onClicked.addListener(async function (tab){
    // TODO change it to arrays
    if(tab.url.match(targetURL)){
        // TODO let player know it only works for certain game pages

        // TODO check if possible game content exists
        // TODO document is not defined???
        // const viewHtmlGame = document.querySelector('[id^="view_html_game_"]');
        // const iframe = viewHtmlGame.querySelector('[id^="html_embed_"] .game_frame iframe');

        // TODO use a new js to build the menu for redirecting? or use content.js
        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['content.js']
        });
    } else if(targetGameURLs.some((urlPattern) => tab.url.match(urlPattern))){
        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['content.js']
        });
    }
    else{
        // TODO if current tab is not target website, alert a warning
    }
});


chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`A content script sent a message: ${request.greeting}`);
    sendResponse({ response: "Response from background script" });
});


