let interactiveElements = [];
let isNarrationOn = false;
let isHighlightOn = false;
let isSonificationOn = false;
const interactiveTags = ['button', 'a', 'input[type="submit"]'];
function isInteractiveNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
    }
    return node.tagName.toLowerCase() === 'button' || node.tagName.toLowerCase() === 'a'
        || (node.tagName.toLowerCase() === 'input' && node.getAttribute('type') === 'submit');
}

function isInteractiveElementActive(element){
    if(element.disabled === true){
        return false;
    }
    return isElementPhysicallyVisible(element);
}

const interactiveElementsObserver = new MutationObserver(async mutationsList => {
    for (let mutation of mutationsList) {
        // If the mutation is caused by our highlight, skip it.
        if ((mutation.addedNodes.length === 1 && mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains('xuan'))||
            mutation.removedNodes.length === 1 && mutation.removedNodes[0].classList && mutation.removedNodes[0].classList.contains('xuan')) {
            continue;
        }

        if (mutation.type === 'childList') {
            // if addedNodes/removedNodes contains interactive elements, conduct actions
            const addedInteractiveElements = Array.from(mutation.addedNodes).filter(node => isInteractiveNode(node));
            const removedInteractiveElements = Array.from(mutation.removedNodes).filter(node => isInteractiveNode(node));
            // Even if an interactive node is added, doesn't mean its status is clickable, thus, check before add into array
            addedInteractiveElements.forEach(elem => {
                if(isInteractiveElementActive(elem)){
                    addInteractiveElement(elem);
                }
            });
            removedInteractiveElements.forEach(node => removeInteractiveElement(node));
            continue;
        }

        if (mutation.type === 'attributes') {
            // TODO return if the mutated style will not affect the element visibility

            // If an interactive element's style changes, OR if an element containing descendant interactables changes
            if (mutation.target.tagName && isInteractiveNode(mutation.target)){
                const computedStyle = window.getComputedStyle(mutation.target);

                // Check its visibility state immediately, unless it has an animation attached, in that case wait until the animation ends
                if(computedStyle.animationName.toLowerCase() !== 'none'){
                    // TODO only set event listener if element is not at its animated final state
                    mutation.target.addEventListener('animationend', function onInteractiveElemAnimationEnd(){
                        isInteractiveElementActive(mutation.target)?
                            addInteractiveElement(mutation.target):
                            removeInteractiveElement(mutation.target);
                        mutation.target.removeEventListener('animationend', onInteractiveElemAnimationEnd);
                    });
                }
                isInteractiveElementActive(mutation.target)?
                    addInteractiveElement(mutation.target):
                    removeInteractiveElement(mutation.target);

            }else{
                let DescendantInteractives = [];
                interactiveTags.forEach(tag => {
                    DescendantInteractives = DescendantInteractives.concat(Array.from(mutation.target.querySelectorAll(tag)));
                });
                if(DescendantInteractives.length > 0){
                    const computedStyle = window.getComputedStyle(mutation.target);
                    if(computedStyle.animationName.toLowerCase() !== 'none') {
                        mutation.target.addEventListener('animationend', function onInteractiveElemAncestorAnimationEnd(){
                            DescendantInteractives.forEach(btn => {
                                isInteractiveElementActive(btn)?
                                    addInteractiveElement(btn):
                                    removeInteractiveElement(btn);
                            });
                            mutation.target.removeEventListener('animationend', onInteractiveElemAncestorAnimationEnd);
                        });
                    }
                    DescendantInteractives.forEach(btn => {
                        isInteractiveElementActive(btn)?
                            addInteractiveElement(btn):
                            removeInteractiveElement(btn);
                    });
                }
            }
        }
    }
});

const addInteractiveElement =(interactiveElem, needFilter) =>{
    if(isHighlightOn){
        generateHighlight(interactiveElem);
    }
    if(isNarrationOn){
        injectARIAProperties(interactiveElem);
    }

    if(!interactiveElements.includes(interactiveElem)){
        interactiveElements.push(interactiveElem);
    }

    if(needFilter){
        filterCurrentInteractivesArray();
    }
}

const removeInteractiveElement =(interactiveElem, needGather = true) =>{
    let index = interactiveElements.indexOf(interactiveElem);
    if(index < 0){
        return; // return if the button is not recorded
    }

    if(isHighlightOn){
        removeHighlight(index);
    }
    if(isNarrationOn){
        injectARIAHidden(interactiveElem);
    }
    interactiveElements.splice(index, 1);

    // some interactive elements maybe covered by this removed button
    if(needGather){
        gatherUnclaimedInteractives();
    }
}

// This function make sure array only contain current visible elements
const filterCurrentInteractivesArray =() => {
    for(let i = 0;i < interactiveElements.length; i++){
        if(!isInteractiveElementActive(interactiveElements[i])){
            removeInteractiveElement(interactiveElements[i], false);
        }
    }
}

const gatherUnclaimedInteractives =() => {
    let allInteractive = collectExistingInteractives();
    allInteractive.filter(i => !interactiveElements.includes(i));
    allInteractive.forEach(i => addInteractiveElement(i, false));
}

const collectExistingInteractives =(filterInvisible = true) =>{
    let allInteractive = [];
    if(filterInvisible){
        interactiveTags.forEach(tag => {
            allInteractive = allInteractive.concat(querySelectorAllActive(document.body, tag));
        });
    }else{
        interactiveTags.forEach(tag => {
            allInteractive = allInteractive.concat(Array.from(document.body.querySelectorAll(tag)));
        });
    }
    return allInteractive;
}

const establishObservation =() =>{
    // If observation had been established, return
    // if(isHighlightOn || isNarrationOn  || isSonificationOn){
    //     return;
    // }

    const config = {
        childList: true
        , subtree: true
        , attributes: true
        , attributeOldValue: true
        // , attributeFilter: ['class','style']
        , attributeFilter: ['class','style', 'disabled']
    };
    interactiveElementsObserver.observe(document.body, config);
}

const stopObservation =() =>{
    if(isHighlightOn || isNarrationOn  || isSonificationOn){
        return;
    }
    interactiveElementsObserver.disconnect();
    interactiveElements.length = 0;
}

function toggleHighlight(newValue){
    isHighlightOn = newValue;
    if(newValue){
        if(!isNarrationOn && !isSonificationOn){
            establishObservation(); // Only start a new observation if it does NOT exist
            collectExistingInteractives().forEach(i => addInteractiveElement(i));
        }else{
            interactiveElements.forEach(i => generateHighlight(i));
        }
    }else{
        // remove all highlights & empty array
        for(let i = 0; i < highlightDIVs.length; i++){
            highlightDIVs[i].remove();
        }
        highlightDIVs.length = 0;
        stopObservation();
    }
}

function toggleNarration(newValue){
    isNarrationOn = newValue;
    if(newValue){
        if(!isHighlightOn && !isSonificationOn){
            establishObservation();

            // set aria-hidden to invisible buttons, and proper aria-labels to the rest
            const all = collectExistingInteractives(false);
            const visible = collectExistingInteractives();
            const shouldHide = all.filter(element => !visible.includes(element));
            visible.forEach(i => addInteractiveElement(i));
            shouldHide.forEach(i => injectARIAHidden(i));
        }else{
            const all = collectExistingInteractives(false);
            const shouldHide = all.filter(element => !interactiveElements.includes(element));
            interactiveElements.forEach(i => injectARIAProperties(i));
            shouldHide.forEach(i => injectARIAHidden(i));
        }

        // implicitly set aria-atomic:true & aria-live:polite, so that changes will be notified
        if(!document.body.hasAttribute('role')){
            document.body.setAttribute('role', 'status');
            document.body.setAttribute('data-manually-added-ARIA', 'static');
        }
        // set aria-live:off to medias
        const media = [];
        document.body.querySelectorAll('video').forEach(i => media.push(i));
        document.body.querySelectorAll('audio').forEach(i => media.push(i));
        media.forEach(i => {
            if(!i.hasAttribute('aria-label') && !i.hasAttribute('role')){
                i.setAttribute('aria-live', 'off');
                i.setAttribute('aria-hidden', 'true ');
                i.setAttribute('data-manually-added-ARIA', 'static');
            }
        });
    }else{
        clearARIAInjections();
        stopObservation();
    }
}

function injectARIAProperties(interactiveElem){
    // If the element has any pre-defined ARIA properties, return
    if(!interactiveElem.hasAttribute('data-manually-added-ARIA') && (interactiveElem.attributes.ariaHidden === 'true'
        || interactiveElem.attributes.ariaLabel !== undefined
        || interactiveElem.attributes.ariaRoleDescription !== undefined)){
        return;
    }

    // If manually added aria-hidden exists, remove it
    if(interactiveElem.getAttribute('data-manually-added-ARIA') === 'hide'){
        interactiveElem.removeAttribute('data-manually-added-ARIA');
        interactiveElem.removeAttribute('aria-hidden');
        interactiveElem.removeAttribute('tabIndex');
    }

    // If alt exists/button innerHtml exist
    let isBtnContentSemantic;
    if((interactiveElem.tagName.toLowerCase() === 'input' && interactiveElem.type.toLowerCase() === 'submit' && interactiveElem.hasAttribute('alt'))
        ||(interactiveElem.tagName.toLowerCase() === 'button' && (isBtnContentSemantic = isButtonContentSemantic(interactiveElem)))) {
        return;
    }

    // set corresponding role type
    if(interactiveElem.type === undefined && interactiveElem.role === undefined){
        setRoleBasedOnTag(interactiveElem);
    }

    // get semantic description from class name, id, etc
    const classNames = Array.from(interactiveElem.classList);
    const id = interactiveElem.id;
    let description = classNames.join(' ') + ' ' + id;
    let words = description.split(/\s+/);
    words = [...new Set(words)]; // remove duplicated words
    const uniqueWords = []; // remove self-contained words
    words.forEach(word => {
        const tmpWord = word.toLowerCase();
        const index = uniqueWords.findIndex(uniqueWord => tmpWord !== uniqueWord.toLowerCase() && tmpWord.includes(uniqueWord.toLowerCase()));
        if (index !== -1) {
            uniqueWords.splice(index, 1, word);
        } else if (!(uniqueWords.some(uniqueWord => uniqueWord.toLowerCase().includes(tmpWord)))) {
            uniqueWords.push(word);
        }
    });
    const uniqueDescription = uniqueWords.join(' ').replace(/(btn|button)/gi, '');

    if(uniqueDescription.length > 0){
        interactiveElem.setAttribute('aria-label', uniqueDescription);
        interactiveElem.setAttribute('data-manually-added-ARIA', 'show'); // an identifier ease cleaning
        // remove its inner content if it's only arbitrary content TODO this can be error-prone
        if(isBtnContentSemantic === false){
            interactiveElem.innerHTML = '';
        }
        interactiveElem.setAttribute('aria-live', 'off');
    }
}

function clearARIAInjections(){
    let allInteractive = [];
    interactiveTags.forEach(tag => {
        allInteractive = allInteractive.concat(Array.from(document.body.querySelectorAll(tag)));
    });
    allInteractive.forEach(i => {
        if(i.getAttribute('data-manually-added-ARIA') === 'show'){
            i.removeAttribute('aria-label');
            i.removeAttribute('role');
        }else if(i.getAttribute('data-manually-added-ARIA') === 'hide'){
            i.removeAttribute('aria-hidden');
        }
        i.removeAttribute('data-manually-added-ARIA');
    });

    // clear the rest static injected ARIAs
    if(document.body.hasAttribute('data-manually-added-ARIA')){
        document.body.removeAttribute('role');
        document.body.removeAttribute('data-manually-added-ARIA');
    }
    const staticNodes = document.body.querySelectorAll('[data-manually-added-ARIA]');
    staticNodes.forEach(n => {
        n.removeAttribute('data-manually-added-ARIA');
        n.removeAttribute('aria-hidden');
        n.removeAttribute('aria-live');
    });
}

function injectARIAHidden(interactiveElem){
    // If the element has any pre-defined ARIA properties, return
    if(!interactiveElem.hasAttribute('data-manually-added-ARIA') &&
        interactiveElem.hasAttribute('aria-hidden')){
        return;
    }

    if(interactiveElem.getAttribute('data-manually-added-ARIA') === 'show'){
        interactiveElem.removeAttribute('data-manually-added-ARIA');
        interactiveElem.removeAttribute('aria-label');
        interactiveElem.removeAttribute('role');
    }

    interactiveElem.setAttribute('aria-hidden', 'true');
    interactiveElem.setAttribute('data-manually-added-ARIA', 'hide'); // an identifier ease cleaning
    interactiveElem.setAttribute('tabIndex', '-1');
}



const highlightBorderWidth = 4;
const highlightPadding = 1;
// TODO change name
const highlightCSS = ` 
    .xuan {
        // z-index: -1;!important;
        border: ${highlightBorderWidth}px dashed greenyellow;!important;
        position: absolute;!important;
        animation: blink 2s infinite alternate;!important;
        pointer-events: none;!important;
    }
    @keyframes blink {
        0% {
            border-color: greenyellow;!important;
        }
        20% {
            border-color: greenyellow;!important;
        }
        80%{
            border-color: rgba(173, 255, 47, 0.1);!important;
        }
        100% {
            border-color: transparent;!important;
        }
    }
`;
const highlightCSSID = "xuexian_ace_demo_highlight_css"; // TODO change name
let highlightDIVs = []; //each interactive element's corresponding highlight div, with the same order in interactiveElements

function generateHighlight(interactiveElem){
    const index = interactiveElements.indexOf(interactiveElem);
    if(highlightDIVs[index]){
        const index = interactiveElements.indexOf(interactiveElem);
        setHighlightRect(interactiveElem, highlightDIVs[index]);
        highlightDIVs[index].style.zIndex = getNumericalZIndex(interactiveElem).toString();
    }
    else{
        const highlight = document.createElement('div');
        highlight.classList.add('xuan');
        setHighlightRect(interactiveElem, highlight);
        highlight.style.zIndex = getNumericalZIndex(interactiveElem).toString();
        interactiveElem.parentNode.insertBefore(highlight, interactiveElem);
        highlightDIVs.push(highlight);
    }
}

function removeHighlight(index){
    if(interactiveElements[index] && highlightDIVs[index]){
        highlightDIVs[index].remove();
        highlightDIVs.splice(index, 1);
    }
}

const injectHighlightCSS =() => {
    const styleElement = document.createElement('style');
    styleElement.id = highlightCSSID;
    styleElement.textContent = highlightCSS;
    document.head.appendChild(styleElement);
};

function setHighlightRect(interactiveElem, highlight){
    const mainElement = document.querySelector('main');
    let minTop = 0;
    let minLeft = 0;
    let maxWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
    let maxHeight = Math.min(window.innerHeight, document.documentElement.clientHeight);

    if(mainElement){
        const mainStyle = window.getComputedStyle(mainElement);
        if(mainStyle.overflow !== 'visible'){
            minTop = Math.max(parseInt(mainStyle.top), minTop);
            minLeft = Math.max(parseInt(mainStyle.left), minLeft);
            maxWidth = Math.min(parseInt(mainStyle.width), maxWidth);
            maxHeight = Math.min(parseInt(mainStyle.height), maxHeight);
        }
    }
    const offset = highlightBorderWidth + highlightPadding;
    highlight.style.width = Math.min(interactiveElem.offsetWidth + offset * 2, maxWidth) + 'px';
    highlight.style.height = Math.min(interactiveElem.offsetHeight + offset * 2, maxHeight)  + 'px';
    highlight.style.top = Math.max(interactiveElem.offsetTop - offset, minTop) + 'px';
    highlight.style.left = Math.max(interactiveElem.offsetLeft - offset, minLeft) + 'px';
}
