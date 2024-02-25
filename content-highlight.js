const interactiveTags = ['button', 'a', 'input[type="submit"]'];
const highlightBorderWidth = 4;
const highlightPadding = 1;
const highlightCSS = `
    .xuan {
        // z-index: -1;!important;
        border: ${highlightBorderWidth}px dashed greenyellow;!important;
        position: absolute;!important;
        animation: blink 2s infinite alternate;!important;
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
const highlightCSSID = "xuexian_ace_demo_highlight_css";
let interactiveElements = [];
let highlightDIVs = []; //each interactive element's corresponding highlight div, with the same order in interactiveElements


const interactiveElementsObserver = new MutationObserver(mutationsList => {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            if (mutation.target.tagName && interactiveTags.includes(mutation.target.tagName.toLowerCase())) {
                // todo add node, remove node?
                if(isElementPhysicallyVisible(mutation.target)){
                    generateHighlight(mutation.target);
                }
            }
        }

        if (mutation.type === 'attributes' &&
            (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
            // TODO return if the mutated style will not affect the element visibility

            // If an interactive element's style changes, OR if an element containing descendant interactables changes
            if (mutation.target.tagName
                && interactiveTags.includes(mutation.target.tagName.toLowerCase())){
                const computedStyle = window.getComputedStyle(mutation.target);

                // Check its visibility state immediately, unless it has an animation attached, in that case wait until the animation ends
                if(computedStyle.animationName.toLowerCase() === 'none'){
                    isElementPhysicallyVisible(mutation.target)?
                        generateHighlight(mutation.target):
                        removeHighlight(mutation.target);
                }else{
                    mutation.target.addEventListener('animationend', function onInteractiveElemAnimationEnd(){
                        isElementPhysicallyVisible(mutation.target)?
                            generateHighlight(mutation.target):
                            removeHighlight(mutation.target);
                        mutation.target.removeEventListener('animationend', onInteractiveElemAnimationEnd);
                    });
                }
            }else{
                let DescendantInteractables = [];
                interactiveTags.forEach(tag => {
                    DescendantInteractables = DescendantInteractables.concat(Array.from(mutation.target.querySelectorAll(tag)));
                });

                if(DescendantInteractables.length > 0){
                    const computedStyle = window.getComputedStyle(mutation.target);
                    if(computedStyle.animationName.toLowerCase() === 'none') {
                        DescendantInteractables.forEach(btn => {
                            isElementPhysicallyVisible(btn)?
                                generateHighlight(btn):
                                removeHighlight(btn);
                        });

                        // isElementPhysicallyVisible(mutation.target)?
                        //     DescendantInteractables.forEach(btn => generateHighlight(btn)):
                        //     DescendantInteractables.forEach(btn => removeHighlight(btn));
                    }else{
                        mutation.target.addEventListener('animationend', function onInteractiveElemAncestorAnimationEnd(){
                            // isElementPhysicallyVisible(mutation.target)?
                            //     DescendantInteractables.forEach(btn => generateHighlight(btn)):
                            //     DescendantInteractables.forEach(btn => removeHighlight(btn));
                            DescendantInteractables.forEach(btn => {
                                isElementPhysicallyVisible(btn)?
                                    generateHighlight(btn):
                                    removeHighlight(btn);
                            });
                            mutation.target.removeEventListener('animationend', onInteractiveElemAncestorAnimationEnd);
                        });
                    }
                }
            }
        }
    }
});

const injectHighlightCSS =() => {
    const styleElement = document.createElement('style');
    styleElement.id = highlightCSSID;
    styleElement.textContent = highlightCSS;
    document.head.appendChild(styleElement);
}

function generateHighlight(interactiveElem){
    const offset = highlightBorderWidth + highlightPadding;

    if(interactiveElements.includes(interactiveElem)){
        const index = interactiveElements.indexOf(interactiveElem);
        highlightDIVs[index].style.width = interactiveElem.offsetWidth + offset * 2 + 'px';
        highlightDIVs[index].style.height = interactiveElem.offsetHeight + offset * 2  + 'px';
        highlightDIVs[index].style.top = interactiveElem.offsetTop - offset + 'px';
        highlightDIVs[index].style.left = interactiveElem.offsetLeft - offset + 'px';
        highlightDIVs[index].style.zIndex = (interactiveElem.style.zIndex - 1).toString();
    }
    else{
        const highlight = document.createElement('div');
        highlight.classList.add('xuan');

        highlight.style.width = interactiveElem.offsetWidth + offset * 2 + 'px';
        highlight.style.height = interactiveElem.offsetHeight + offset * 2  + 'px';
        highlight.style.top = interactiveElem.offsetTop - offset + 'px';
        highlight.style.left = interactiveElem.offsetLeft - offset + 'px';
        highlight.style.zIndex = (interactiveElem.style.zIndex - 1).toString();

        interactiveElem.parentNode.insertBefore(highlight, interactiveElem.nextSibling);
        interactiveElements.push(interactiveElem);
        highlightDIVs.push(highlight);
    }
}

function removeHighlight(interactiveElem){
    const index = interactiveElements.indexOf(interactiveElem);
    if(interactiveElements[index] && highlightDIVs[index]){
        interactiveElements.splice(index, 1);
        highlightDIVs[index].remove();
        highlightDIVs.splice(index, 1);
    }
}

function toggleHighlight(newValue){
    if(newValue){
        const body = document.querySelector('body');

        // for testing
        const spot1 = document.getElementById('spot1');
        spot1.style.color = "red";
        spot1.style.opacity = '1';

        let allInteractive = [];
        interactiveTags.forEach(tag => {
            allInteractive = allInteractive.concat(querySelectorAllVisible(body, tag));
        });
        allInteractive.forEach(i => generateHighlight(i));

        const config = {
            childList: true
            , subtree: true
            , attributes: true
            , attributeFilter: ['class','style']
        };
        interactiveElementsObserver.observe(body, config);
    }
    else{
        interactiveElementsObserver.disconnect();

        // remove all highlights, empty arrays when feature toggled OFF
        highlightDIVs.forEach(highlight => {
            highlight.parentNode.removeChild(highlight);
        });
        highlightDIVs.length = 0;
        interactiveElements.length = 0;
    }
}