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
        return (position & Node.DOCUMENT_POSITION_FOLLOWING);
    }
    if(style_o.position !== 'static' && style_e.position !== 'static'){
        if(zIndex_o === zIndex_e){
            return (position & Node.DOCUMENT_POSITION_FOLLOWING);
        }
        return zIndex_o > zIndex_e;
    }
}

// is the object clearly visible and not obstructed or covered by any other objects
function isElementUnobscured(element){
    const rect = element.getBoundingClientRect();
    const centerX = rect.x + rect.width/2;
    const centerY = rect.y + rect.height/2;
    let possibleCovers = document.elementsFromPoint(centerX, centerY);
    console.log(element);
    console.log(possibleCovers);
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
    console.log(possibleCovers);
    return possibleCovers.length <= 0;
}

function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    console.log(element);
    console.log((
        rect.top < viewportHeight &&
        rect.bottom >0 &&
        rect.left < viewportWidth &&
        rect.right >0
    ));


    return (
        rect.top < viewportHeight &&
        rect.bottom >0 &&
        rect.left < viewportWidth &&
        rect.right >0
    );
}

// This function checks if an element is currently visible,
// If any animation defined, it checks the instant frame instead of the final state.
function isElementPhysicallyVisible(element){
    let tmp = element;
    while(tmp !== null && tmp.tagName.toLowerCase() !== 'body'){
        const computedStyle = window.getComputedStyle(tmp);

        if(computedStyle.display === 'none'
            || computedStyle.visibility === 'hidden'
            // || computedStyle.opacity === '0'
            || computedStyle.pointerEvents === 'none'
        ){
            return false;
        }
        tmp = tmp.parentElement;
    }
    return isElementInViewport(element) && isElementUnobscured(element);
}

// return all physically visible descendant elements
const querySelectorAllVisible =(elem, query) => {
    if(!(elem instanceof HTMLElement)){
        return;
    }
    return Array.from(elem.querySelectorAll(query)).filter(e => isElementPhysicallyVisible(e));
}


let myQueryHelper = (elem, query, results) => {
    if (elem.className.toString().indexOf(query) >= 0) {
        results.push(elem);
    }
    for (let child = elem.firstElementChild; child; child = child.nextElementSibling) {
        myQueryHelper(child, query, results);
    }
};

let myQuery = (elem, query) => {
    let results = [];
    myQueryHelper(elem, query, results);
    return results[0] || null;
};

let myQueryAll = (elem, query) => {
    let results = [];
    myQueryHelper(elem, query, results);
    return results;
};