const CSSBracesFix =(str) =>{
    const open = (str.match(/{/g) || []).length;
    const close = (str.match(/}/g) || []).length;
    const difference = open - close;
    if(difference > 0){
        // add more close braces
        str += '}'.repeat(difference);
    }else if(difference < 0){
        // TODO more open braces, would this happen?
    }
    return str;
}

const extractFontSizeOutOfMatchArray =(match) => {
    if(match === null){
        return;
    }
    if(match.length > 0){
        if(match[0].includes('.')){return parseFloat(match[0]);}
        else{return parseInt(match[0]);}
    }
}

const splitAndReplace =(str, regex, sub) =>{
    const arr = regex.exec(str);
    if(arr !== null && arr[0] !== ''){
        const splitIndex1 = arr.index;
        const splitIndex2 = arr.index + arr[0].length;
        const split1 = str.substring(0, splitIndex1);
        const split2 = str.substring(splitIndex2);
        str = split1 + sub + split2;
    }
    return str;
}

function constrainNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}


function getClosestPositionedAncestor(element) {
    let ancestor = element.parentElement;
    while (ancestor) {
        const computedStyle = window.getComputedStyle(ancestor);
        if (computedStyle.position !== 'static' && computedStyle.zIndex !== 'auto') {
            return ancestor;
        }
        ancestor = ancestor.parentElement;
    }
    return null;
}

function getStackingContext(element, style){
    if(style === undefined || style === null){
        style = window.getComputedStyle(element);
    }

    if(style.position === 'sticky'
        || style.position === 'absolute'
        || style.position === 'fixed'){
        return element;
    }
    if (element.parentElement) {
        const parentStyle = window.getComputedStyle(element.parentElement);
        if (parentStyle.position === 'relative') {
            return element.parentElement;
        }
        return getStackingContext(element.parentElement, parentStyle);
    }
    return document.body;
}


function getNumericalZIndex(element) {
    const style = window.getComputedStyle(element);
    let zIndex = style.getPropertyValue('z-index');

    if(element.tagName.toLowerCase() === 'body'){
        const z = parseInt(zIndex);
        return isNaN(z) ? 0: z;
    }

    if(zIndex === 'auto' || zIndex === 'initial' || zIndex === 'unset'
        || style.position === 'static'){
        return 0;
    }else if(zIndex === 'inherit'){
        return getNumericalZIndex(element.parentElement);
    }
    const z = parseInt(zIndex);
    return isNaN(z)? 0: z;
}

function getAncestors(element) {
    const ancestors = [];
    let current = element.parentElement;
    while (current !== null && current.tagName.toLowerCase() !== 'html') {
        ancestors.unshift(current);
        current = current.parentElement;
    }
    return ancestors;
}

function findFarthestSeparateAncestors(element1, element2) {
    const ancestors1 = getAncestors(element1);
    const ancestors2 = getAncestors(element2);

    let i;
    for (i = 0; i < Math.min(ancestors1.length, ancestors2.length); i++) {
        if (ancestors1[i] !== ancestors2[i]) {
            break;
        }
    }
    return [ancestors1[i], ancestors2[i]];
}

function isElementVisuallyUnderTheOther(element, theOther){
    const ancestors = findFarthestSeparateAncestors(element, theOther);
    const ancestor_e = ancestors[0];
    const ancestor_o = ancestors[1];

    let zIndex_e, zIndex_o;
    let style_e, style_o;
    const position = element.compareDocumentPosition(theOther);
    // If 2 elements under same node, compare their stacking context and z-index
    zIndex_e = getNumericalZIndex(element);
    zIndex_o = getNumericalZIndex(theOther);
    style_e = window.getComputedStyle(element);
    style_o = window.getComputedStyle(theOther);
    // compare ancestors' z-index ONLY when they are not under the same node
    if(ancestor_e !== ancestor_o){
        if(ancestor_e !== undefined){
            zIndex_e = getNumericalZIndex(ancestor_e);
            style_e = window.getComputedStyle(ancestor_e);
        }
        if(ancestor_o !== undefined){
            zIndex_o = getNumericalZIndex(ancestor_o);
            style_o = window.getComputedStyle(ancestor_o);
        }
    }

    if(style_o.position === 'static'){
        return false;
    }
    if(style_o.position !== 'static' && style_e.position === 'static' ){
        if(position & Node.DOCUMENT_POSITION_FOLLOWING){
            return true;
        }else if(Node.DOCUMENT_POSITION_PRECEDING){
            return zIndex_o > zIndex_e;
        }
    }
    if(style_o.position !== 'static' && style_e.position !== 'static'){
        if(zIndex_o === zIndex_e){
            return (position & Node.DOCUMENT_POSITION_FOLLOWING);
        }
        return zIndex_o > zIndex_e;
    }
    return false;
}

// is the object clearly visible and not obstructed or covered by any other objects
function isElementUnobscured(element){
    const rect = element.getBoundingClientRect();
    const centerX = rect.x + rect.width/2;
    const centerY = rect.y + rect.height/2;
    let possibleCovers = document.elementsFromPoint(centerX, centerY);
    // if(element.id === 'spot1'){
    //     console.log(possibleCovers);
    // }
    possibleCovers = possibleCovers.filter(c => {
        // remove self and ace_demo panel
        if (c === element || c.id === 'ace_demo_popup') {
            return false;
        }
        // remove ancestors and descendants
        const position = element.compareDocumentPosition(c);
        if (position & Node.DOCUMENT_POSITION_CONTAINED_BY || position & Node.DOCUMENT_POSITION_CONTAINS) {
            return false;
        }
        // remove invisible ones
        const tmpStyle = window.getComputedStyle(c);
        if (tmpStyle.display === 'none' || tmpStyle.visibility === 'hidden') {
            return false;
        }

        return isElementVisuallyUnderTheOther(element, c);
    });
    // if(element.id === 'spot1'){
    //     console.log(possibleCovers);
    // }
    return possibleCovers.length <= 0;
}

function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    return (
        rect.top < viewportHeight - 5 &&
        rect.bottom > 5 &&
        rect.left < viewportWidth -5 &&
        rect.right > 5
    );
}

function isInteractiveElementActive(element){
    if(element.disabled === true){
        return false;
    }
    return isElementPhysicallyVisible(element);
}

// This function checks if an element is currently visible,
// If any animation defined, it checks the instant frame instead of the final state.
function isElementPhysicallyVisible(element){
    let tmp = element;
    while(tmp !== null && tmp.tagName.toLowerCase() !== 'body'){
        const computedStyle = window.getComputedStyle(tmp);
        if(computedStyle.display === 'none'
            || computedStyle.visibility === 'hidden'
            || computedStyle.pointerEvents === 'none'
        ){
            return false;
        }
        tmp = tmp.parentElement;
    }
    return isElementInViewport(element) && isElementUnobscured(element);
}

const querySelectorAllActive =(elem, query) => {
    return querySelectorAllVisible(elem, query).filter(e => e.disabled === false);
}

// return all physically visible descendant elements
const querySelectorAllVisible =(elem, query) => {
    if(!(elem instanceof HTMLElement)){
        return [];
    }
    return Array.from(elem.querySelectorAll(query)).filter(e => isElementPhysicallyVisible(e));
}


function setRoleBasedOnTag(element) {
    const elementType = element.tagName.toLowerCase();

    const roleMap = {
        'button': 'button',
        'a': 'link',
        'input[type="submit"]': 'button'
    };
    if (roleMap.hasOwnProperty(elementType)) {
        element.setAttribute('role', roleMap[elementType]);
    }
}

if (!RegExp.escape) {
    RegExp.escape = function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };
}

function isButtonContentSemantic(button) {
    let innerHTML = button.innerHTML;
    const disallowedContent = [
        '',             // Empty content
        '&nbsp;',      // Non-breaking space
        '<br>',        // Line break
        '<br />',      // Line break (self-closing)
        '<div></div>', // Empty div
        '<span></span>', // Empty span
        '&',            // Ampersand
        '#',            // Hash symbol
        '*',            // Asterisk
        '@',            // At symbol
        '$',            // Dollar sign
        '%',            // Percent sign
        '^',            // Caret
        '`',            // Backtick
        '~',            // Tilde
        '|',            // Pipe
        '<',            // Less than
        '>',            // Greater than
        '{',            // Opening curly brace
        '}',            // Closing curly brace
        '[',            // Opening square bracket
        ']',            // Closing square bracket
        '(',            // Opening parenthesis
        ')',            // Closing parenthesis
        '/',            // Forward slash
        '\\',           // Backward slash
        '+',            // Plus
        '=',            // Equal sign
        '-',            // Hyphen-minus
        '_',            // Underscore
        ':',            // Colon
        ';',            // Semicolon
        '"',            // Double quote
        "'",            // Single quote
        '.',            // Period
        ',',            // Comma
        '!',            // Exclamation mark
        '?',            // Question mark
        '&amp;',       // HTML entity for ampersand
        '&lt;',        // HTML entity for less than
        '&gt;',        // HTML entity for greater than
        '&quot;',      // HTML entity for double quote
        '&apos;',      // HTML entity for single quote
    ];

    disallowedContent.forEach(content => {
        innerHTML = innerHTML.replace(new RegExp(RegExp.escape(content), 'gi'), '');
    });
    return innerHTML.trim().length > 0;
}


function isCursorInsideRect(rect, cursorX, cursorY) {
    return cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom;
}

// return an element from array elements, that is closet to a position (cursorX/Y)
function getClosestElementAndDistance(elements, cursorX, cursorY) {
    let closestElement = null;
    let minDistance = Number.MAX_VALUE;

    // todo consider when cursor falls into overlap of 2 more buttons

    elements.forEach(function(element) {
        let rect = element.getBoundingClientRect();

        // special case: cursor is above the element's rect
        if(isCursorInsideRect(rect, cursorX, cursorY)){
            minDistance = -1;
            closestElement = element;
            return { closestElement: closestElement, distance: minDistance };
        }

        let centerX = rect.left + rect.width / 2;
        let centerY = rect.top + rect.height / 2;
        let distance = Math.sqrt(Math.pow(cursorX - centerX, 2) + Math.pow(cursorY - centerY, 2));
        if (distance < minDistance) {
            minDistance = distance;
            closestElement = element;
        }
    });
    return { closestElement: closestElement, distance: minDistance };
}

let speechHistory; //avoid multiple speech with same content
function speak(text, assertive = true) {
    if(speechHistory === text){
        return;
    }
    if(assertive){
        speechSynthesis.cancel(); // cancel any existing speech
    }

    const msg = new SpeechSynthesisUtterance();
    msg.text = text;
    msg.lang = 'en-US';
    msg.volume = 0.5; // todo 音量控制
    speechSynthesis.speak(msg);
    speechHistory = text;
}

// gather all text content under a HTML element
function gatherTextContent(element) {
    let textContent = '';
    element.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            let tagName = node.tagName.toLowerCase();
            if(tagName === 'button' || tagName === 'a' || (tagName === 'input' && node.getAttribute('type') === 'submit')) {
                if (isElementPhysicallyVisible(node)) {
                    textContent += `${extractDescription(node)} \n`;
                }
            }
            else {
                const style = window.getComputedStyle(node);
                if(style.display === 'none'){
                    return;
                }
                if (tagName === 'p' || tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
                    const content = node.innerText.trim();
                    if(content !== ''){
                        textContent += `${content} \n`;
                    }
                }else if(tagName !== 'script'){
                    textContent += gatherTextContent(node).trim();
                }
            }
        }else if(node.nodeType === Node.TEXT_NODE){
            const content = node.textContent.trim();
            if(content !== ''){
                textContent += `${content} \n`;
            }
        }
    });
    return textContent;
}

// extract semantic description for interactive elements
function extractDescription(element){
    let elemType = 'button';
    if(element.tagName.toLowerCase() === 'a'){
        elemType = 'link';
    }
    if(element.tagName.toLowerCase() === 'input' && element.type.toLowerCase() === 'submit'){
        if(element.hasAttribute('alt')){
            return `${elemType} ${element.alt}`;
        }else if(element.hasAttribute('aria-label')){
            return `${elemType} ${element.getAttribute('aria-label')}`;
        }else{
            return `${elemType} ${extractSemanticDescription(element)}`;
        }
    }else{
        if(isButtonContentSemantic(element)){
            return `${elemType} ${element.textContent}`;
        }else if(element.hasAttribute('aria-label')){
            return `${elemType} ${element.getAttribute('aria-label')}`;
        }else{
            return `${elemType} ${extractSemanticDescription(element)}`;
        }
    }
}
