/* container for all accessibility features, will be displayed inside <ace-demo> tag */


// TODO 如何像grammarly一样用自己的html tags
// class AceDemo extends HTMLElement {
//     constructor() {
//         super();
//     }
// }
// customElements.define('ace-demo', AceDemo);
// const aceDemo = new AceDemo();
// document.innerHTML.appendChild(aceDemo);


/**
 * generate UI
 */

let root; // root node for all features
let rootID = 'ace_demo_popup';


// create the root Node for whole extension HTMLs
const createDOMRoot = () => {
    // TODO change id to customized tag, prefix SHOULD BE global variable
    const popupDiv = document.createElement('div');
    popupDiv.setAttribute('id', rootID);
    popupDiv.setAttribute('data-html2canvas-ignore', "true");
    document.documentElement.appendChild(popupDiv);
    return popupDiv.attachShadow({mode: 'open'});
}

// generate the window div for containing popup-body.html
const createPopupWindowDiv = (parentNode) =>{
    // create the anchor node for draggable window
    const mainDivInShadow = document.createElement('div');
    mainDivInShadow.setAttribute(
        'style',
        "z-index: 2147483650; position: absolute; top: 0px; left: 0px; width: 100%;"
    )
    parentNode.appendChild(mainDivInShadow);

    // create an overlay
    const windowDiv = document.createElement('div');
    windowDiv.setAttribute('data-ace-id', 'ace_demo_window');
    windowDiv.setAttribute(
        'style',
        'position:fixed; ' +
        'top: 100px; left: 100px; ' +
        'width: 400px; ' +
        'max-height: 480px; ' +
        'z-index: 2147483650; ' +
        'border: none; ' +
        'background: white; ' +
        'overflow-y: hidden; ' +
        'box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2); ' +
        'border-radius: 10px; ' +
        'cursor: default;!important; '
    );
    mainDivInShadow.appendChild(windowDiv);
    return windowDiv;
}

const applyStyleSheet = (parentNode) => {
    // apply correct CSS under the shadow root
    const CSSLink = document.createElement('link');
    CSSLink.setAttribute('rel', 'stylesheet')
    CSSLink.setAttribute('href', chrome.runtime.getURL("popup/popup.css"));
    parentNode.appendChild(CSSLink);
}

const applyScripts = (parentNode) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL("popup/popup.js");
    parentNode.appendChild(script);
}

// load popup-body.html file and append it to parentNode(window div)
const loadHTML = (parentNode) => {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        // console.log("xhttp: " + this.readyState);
        if (this.readyState === 4 && this.status === 200) {
            const div = document.createElement('div');
            div.innerHTML = this.responseText;
            parentNode.appendChild(div);
        } else {
            // console.log('files not found');
        }
    };
    xhttp.open("GET", chrome.runtime.getURL("popup/popup-body.html"), true);
    xhttp.send();
}



/**
 * Generate necessary html/css for selected features
 */
const regexFontSizeValue = /(?<=font-size\s*?:\s*?)(?:[.\d]+)/;
const regexFontFamilyValue = /(?<=font-family\s*?:\s*)(?:[^:;!}]+)/;
const regexFontSizeValueInFont = /(?<=font\s*:[^/};]*)(?:[.\d]+)(?=cm|mm|in|px|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)/g;
const regexFontFamilyValueInFont = /(?<=font\s*:[^/};]*\d+[cm|mm|in|px|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%]*\s)(?:["'0-9a-zA-Z\s,-]+)/g;
const regexCursor = /(?<=cursor\s*:\s*)pointer|default(?=\s*[;|}])/;

let injectionCSSRules = [];
let injectionCSSElement;
const customizedFontCSSID = "xuexian_ace_demo_font_settings" // TODO 改掉
let currentFontSizeFactor = 1, currentFontFamily;
let isFontSettingOn = true; // TODO get & set through pop-up setting
let isCursorSettingOn = true;

const updateInjectionCSS =(newlyAddedRules, needClear = false) => {
    let cssText = '';
    newlyAddedRules.forEach(rule => {
        cssText += rule.css + '\n';
    });
    if(needClear){
        injectionCSSElement.textContent = cssText;
    }
    else{
        injectionCSSElement.textContent = injectionCSSElement.textContent.concat(cssText);
    }
    document.head.appendChild(injectionCSSElement);
}

const getFeatureRelatedStyleSheet =(cssText, isCSSTextOriginal = true) => {
    const results = [];
    const rules = cssText.split(/(?<=})/);
    rules.forEach(rule => {
        if(rule.includes('@font-face')){
            return;
        }

        rule = rule.trim();
        if((rule.match(/{/g) || []).length > 1){
            rule = CSSBracesFix(rule);
        }

        let result = {};
        if(rule.includes('font-size')) {
            let match = rule.match(regexFontSizeValue);
            result.originalFontSize = extractFontSizeOutOfMatchArray(match);
        }
        if(rule.includes('font-family')){
            const match = rule.match(regexFontFamilyValue);
            if(match !== null){
                result.originalFontFamily = match[0].trim();
            }
        }
        if(Object.keys(result).length <= 0){
            // Font property is a combination of font-size, font-family, etc.
            // Usually, font property only appears without their existence.
            if(/font(?=\s*?:)/g.test(rule)){
                // If the rule contains 'font'
                let match1 = rule.match(regexFontSizeValueInFont);
                result.originalFontSize = extractFontSizeOutOfMatchArray(match1);

                const match2 = rule.match(regexFontFamilyValueInFont);
                if(match2 !== null){
                    result.originalFontFamily = match2[0].trim();
                }
            }
        }

        // temporarily unused
        // if(!isCSSTextOriginal && result.originalFontSize !== undefined){
        //     result.originalFontSize = result.originalFontSize/currentFontSizeFactor;
        // }

        if(/cursor\s*:\s*pointer/.test(rule) || /cursor\s*:\s*default/.test(rule)){
            const match = rule.match(regexCursor);
            if(match !== null){
                result.originalCursorStyle = match[0];
            }
        }

        if(Object.keys(result).length > 0){
            result.css = rule;
            results.push(result);
        }
    });
    return results;
}

async function extractRulesFromExternalStylesheets(href) {
    const response = await fetch(href);
    const cssText = await response.text();
    injectionCSSRules = injectionCSSRules.concat(getFeatureRelatedStyleSheet(cssText));
    updateInjectionCSS(injectionCSSRules);
}

// collect font-size, font-family related CSS rules, add these rules to injectionCSSRules
// append these rules to injectionCSSElement
const collectAllFeatureRelatedCSS =() => {
    // If injectionCSSElement exists in the document, just need to make a copy
    // after retrieving multiply factor in onExtensionOpen
    // if(injectionCSSElement.textContent.length > 0){
    //     return;
    // }

    const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
    styleSheets.forEach(link => {
        const href = link.getAttribute('href');
        extractRulesFromExternalStylesheets(href).then(r => {});
    });

    const styleElements = document.querySelectorAll('style');
    styleElements.forEach(styleElement => {
        const styleTextContent = styleElement.textContent;
        injectionCSSRules = injectionCSSRules.concat(getFeatureRelatedStyleSheet(styleTextContent));
        updateInjectionCSS(injectionCSSRules);
    });
}

const initializeFeatureRelatedStuff =() =>{
    if(injectionCSSElement === undefined){
        const temp = document.getElementById(customizedFontCSSID);
        if(temp !== null){
            injectionCSSElement = temp;
        }
        else{
            injectionCSSElement = document.createElement('style');
            injectionCSSElement.id = customizedFontCSSID;
        }
    }
    collectAllFeatureRelatedCSS();

    if(isFontSettingOn){
        if(injectionCSSRules.length <= 0){
            injectionCSSRules.push({
                css:"body{font-size:1rem;!important; font-family: Arial, Helvetica, sans-serif;!important;}",
                originalFontSize: 1,
                originalFontFamily: "Arial, Helvetica, sans-serif"});
        }
    }

    // If current cursor setting is on, create necessary CSS
    if(isCursorSettingOn){
        const cursorInBodyRule = injectionCSSRules.find(rule => /(?<=\bbody\s*{.*)cursor\s*:/.test(rule));
        if(!cursorInBodyRule){
            injectionCSSRules.push({
                css:"body{cursor:default;!important;}",
                originalCursorStyle: "default"
            });
        }
        injectionCSSRules.push({
            css:"a, button, input[type=\"button\"], input[type=\"submit\"], input[type=\"reset\"] {cursor:pointer;!important;}",
            originalCursorStyle: "pointer"
        });
        // comment below to avoid jumping cursor caused by shifting between default text and customized pattern
        // injectionCSSRules.push({
        //     css: "p, li, td, label, option, strong, em, b, i, u, h1, h2, h3, h4, h5, h6 {cursor: text;!important;}",
        //     originalCursorStyle: "text"
        // });
    }
}


/**
 * Communication with the rest of extensions
 */
function onMessageRecieved(event){
    if(!window.location.href.startsWith(event.origin)){
        return;
    }

    if(typeof window[event.data.functionName] === "function"){
        window[event.data.functionName](event.data.parameters.newValue);
    }else{
        console.error("Function not found:", event.data.functionName);
    }
}

// receive messages from service-worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.message === "toggle popup"){
        togglePopup();
        sendResponse({ response: "The popup is toggled successfully." });
    }
    sendResponse({response: "Unknown request." });
});

function togglePopup(){
    root = document.getElementById(rootID);
    if(root.style.display === "none"){
        root.style.display = '';
        window.addEventListener("message", onMessageRecieved);
    }else{
        window.removeEventListener("message", onMessageRecieved);
        window.postMessage({code:"QUIT_SETTING"}, window.location.href);
    }
}

function changeFontSize(newValue) {
    injectionCSSRules.forEach(rule => {
        if(rule.originalFontSize === null || rule.originalFontSize === undefined){
            return;
        }
        currentFontSizeFactor = newValue;
        const newFontSizeValue = rule.originalFontSize * parseFloat(newValue);

        let regex1;
        if(rule.css.includes('font-size')){
            regex1 = RegExp(regexFontSizeValue, '');
        }else{
            regex1 = RegExp(regexFontSizeValueInFont, '');
        }
        rule.css = splitAndReplace(rule.css, regex1, newFontSizeValue.toString())
    });
    // write the new CSS rules to the document
    updateInjectionCSS(injectionCSSRules, true);
    // TODO 改到 onshutdown
    // chrome.storage.sync.set({fontSize: currentFontSizeFactor}, function() {
    //     console.log(`Saved Property fontSize: ${currentFontSizeFactor}`);
    // });
}

function changeFontFamily(newValue){
    injectionCSSRules.forEach(rule => {
        if (rule.originalFontFamily === null || rule.originalFontFamily === undefined) {
            return;
        }
        currentFontFamily = newValue;

        let newFontFamilyStr;
        switch (newValue){
            case "Arial": {newFontFamilyStr = "Arial, Helvetica, sans-serif";break;}
            case "Verdana": {newFontFamilyStr = "Verdana, sans-serif"; break;}
            case "Georgia": {newFontFamilyStr = "Georgia, serif"; break;}
            case "Courier New": {newFontFamilyStr = "'Courier New', monospace";break;}
            case "Times New Roman": {newFontFamilyStr = "\"Times New Roman\", Times, serif"; break;}
            default: {newFontFamilyStr = rule.originalFontFamily; break;}
        }

        let regex1;
        if(rule.css.includes('font-family')){
            regex1 = RegExp(regexFontFamilyValue, '');
        }else{
            regex1 = RegExp(regexFontFamilyValueInFont, '');
        }
        rule.css = splitAndReplace(rule.css, regex1, newFontFamilyStr)
    });
    updateInjectionCSS(injectionCSSRules, true);
    // TODO 改到 onshutdown
    // chrome.storage.sync.set({fontFamily: currentFontFamily}, function() {
    //     console.log(`Saved Property fontSize: ${currentFontFamily}`);
    // });
}

function changeCursorSize(newValue){
    const newCursorSize = newValue * 16;
    injectionCSSRules.forEach(rule => {
        if (rule.originalCursorStyle === null || rule.originalCursorStyle === undefined) {
            return;
        }
        if(rule.originalCursorStyle === "text"){
            return;
        }

        // use OS cursor instead of url referred images IF newValue is 1
        if(newValue === "1"){
            rule.css = splitAndReplace(rule.css, /(?<=cursor:)url\(.+\).+auto/, rule.originalCursorStyle+";");
            return;
        }

        // IF cursor:point OR cursor:default
        if(/cursor\s*:\s*pointer/.test(rule.css) || /cursor\s*:\s*default/.test(rule.css)){
            const cursorImageURL = chrome.runtime.getURL(`images/cursor/cursor-${rule.originalCursorStyle}-${newCursorSize}.png`);
            const x = (rule.css.includes("default"))? 4 * newValue: 6 * newValue;
            const newCursorValue = `url(${cursorImageURL}) ${x} ${newValue}, auto`;
            rule.css = splitAndReplace(rule.css, regexCursor, newCursorValue)
        }else{
            // IF it is substituted url
            rule.css = splitAndReplace(rule.css, /(?<=cursor\s*:\s*url.+)(16|32|48|64)(?=.png)/, newCursorSize.toString())
        }
    });
    updateInjectionCSS(injectionCSSRules, true);
}

/**
 * Initialization
 */

// TODO change the functions name to more specific ones
// retrieve necessary data from storage
function onExtensionOpen(){
    chrome.storage.sync.get(['fontSize', 'fontFamily'], function(data) {
        if(data.fontFamily !== null && data.fontFamily !== undefined){
            currentFontFamily = data.fontFamily;
        }
        if(data.fontSize !== null && data.fontSize !== undefined){
            currentFontSizeFactor = data.fontSize;
            if(injectionCSSElement.textContent.length > 0){
                injectionCSSRules = getFeatureRelatedStyleSheet(injectionCSSElement.textContent, false);
            }
        }
    });
}

const initialize = () => {
    root = document.getElementById(rootID);
    if(root === null){
        root = createDOMRoot();
        applyStyleSheet(root);
        const windowDiv = createPopupWindowDiv(root);
        loadHTML(windowDiv);
        applyScripts(root);
        initializeFeatureRelatedStuff();
        window.addEventListener("message", onMessageRecieved);
    }
}

initialize();




// window.addEventListener("click", (e) => {
//     chrome.runtime.sendMessage({
//         greeting: "Greeting from the content script",
//     }).then(r => {
//         console.log("Message receiving from the background script:");
//         console.log(r.response);
//     }).catch((error) => {
//         console.error(`Error in content js sendMessage: ${error}`);
//     });
// });

    
