
/**
 * basic functionalities for maintaining the popup elements
 */
let rootElem;
const getElementByDataID = (id) => rootElem.querySelector(`[data-ace-id="${id}"]`);

const setSliderFill = (element) =>{
    const value = (element.value-element.min)/(element.max-element.min)*100
    element.style.background = 'linear-gradient(to right, #0b6ae0 0%, #0b6ae0 ' + value + '%, #d3d3d3 ' + value + '%, #d3d3d3 100%)';
}

const setFontSizeSliderListener = () => {
    const fontSizeSliderValue = getElementByDataID('font_size_slider_value');
    const fontSizeSlider = getElementByDataID('font_size_slider');
    fontSizeSlider.oninput = function() {
        fontSizeSliderValue.innerHTML = `${(this.value * 100).toFixed(0)}%`;
        setSliderFill(this);

        // TODO if popup.js is referred by default_popup, chrome.runtime is defined, use chrome.runtime.sendMessage
        // else if popup.js is injected manually by content.js, use window.postMessage

        const messageData = {
            sender: "popup.js",
            functionName: "changeFontSize", // todo 这样不就意味着暴露了content.js的内容吗???
            parameters: {
                newValue: this.value,
            }};
        window.postMessage(messageData, window.location.href);
    }
}


const setCursorSizeSliderListener = () => {
    const fontSizeSliderValue = getElementByDataID('cursor_size_slider_value');
    const fontSizeSlider = getElementByDataID('cursor_size_slider');
    fontSizeSlider.oninput = function() {
        fontSizeSliderValue.innerHTML = `${(this.value * 100).toFixed(0)}%`;
        setSliderFill(this);

        const messageData = {
            sender: "popup.js",
            functionName: "changeCursorSize",
            parameters: {
                newValue: this.value,
            }};
        window.postMessage(messageData, window.location.href);
    }
}

const setFontFamilyDropDown = () => {
    const dropdownBtn = getElementByDataID('font_family_dropdown_btn');
    const dropdown = getElementByDataID('font_family_dropdown');
    for(let i = 0; i < dropdown.children.length; i++){
        const childElem = dropdown.children[i];

        // apply css
        // if(i === 0){childElem.classList.add('first');}
        // else if(i === dropdown.children.length - 1){childElem.classList.add('last');}
        // else {childElem.classList.add('divider');}

        // set onclick function for each option
        childElem.onclick = function (){
            dropdownBtn.innerHTML = childElem.innerHTML;

            // set visual cue for selected option
            const selectedElems = dropdown.getElementsByClassName('selected')
            if(selectedElems !== null){
                selectedElems[0].classList.remove('selected');
            }
            childElem.classList.add('selected');

            const messageData = {
                sender: "popup.js",
                functionName: "changeFontFamily",
                parameters: {
                    newValue: childElem.innerHTML,
                }};
            window.postMessage(messageData, window.location.href);

            // close dropdown menu
            if (!dropdown.classList.contains('hide')) {
                dropdown.classList.add('hide');
            }
        }
    }

    // for (const childElem of dropdown.children){
    // }
}

const showDropdown =() => {
    getElementByDataID("font_family_dropdown").classList.toggle("hide");
}

const HideDropDown =(clickEvent) =>{
    const targetDataID = clickEvent.target.getAttribute('data-ace-id');
    // close dropdown if blank area is clicked
    if(targetDataID !== 'font_family_dropdown_btn'){
        const dropdown = getElementByDataID('font_family_dropdown');
        if (!dropdown.classList.contains('hide')){
            dropdown.classList.add('hide');
        }
    }
}

const onMagnifierCheckboxChanged =(checkbox) => {
    const messageData = {
        sender: "popup.js",
        functionName: "toggleMagnifier",
        parameters: {
            newValue: checkbox.checked
        }};
    window.postMessage(messageData, window.location.href);
    checkbox.checked = false;
}

const onHighlightCheckboxChanged =(checkbox) => {
    const messageData = {
        sender: "popup.js",
        functionName: "toggleHighlight",
        parameters: {
            newValue: checkbox.checked
        }};
    window.postMessage(messageData, window.location.href);
}


const setVolumeSliderListener = (volumeBtn, volumeSlider, volumeSliderValue, regularSVG, muteSVG) => {
    const initialValue = volumeSliderValue.value
    if(initialValue === 0){ muteSVG.classList.add('hide'); }
    else{ regularSVG.classList.add('hide'); }
    volumeBtn.onclick = function (){
        muteSVG.classList.toggle('hide');
        regularSVG.classList.toggle('hide');
    }
    volumeSlider.oninput = function() {
        volumeSliderValue.innerHTML = `${(this.value * 1).toFixed(0).toString()}`;
        if(this.value > 0){
            muteSVG.classList.add('hide');
            regularSVG.classList.remove('hide');
        }
        else{
            regularSVG.classList.add('hide');
            muteSVG.classList.remove('hide');
        }
        setSliderFill(this);
    }
}

const setNarrationVolumeSliderListener = () => {
    const narrationVolumeBtn = getElementByDataID('narration_volume_button');
    const narrationVolumeSlider = getElementByDataID('narration_volume_slider');
    const narrationVolumeSliderValue = getElementByDataID('narration_volume_value');
    const regularSVG = getElementByDataID('narration_volume_svg');
    const muteSVG = getElementByDataID('narration_volume_mute_svg');
    setVolumeSliderListener(narrationVolumeBtn, narrationVolumeSlider, narrationVolumeSliderValue,
        regularSVG, muteSVG);
}

const setGameVolumeSliderListener = () => {
    const gameVolumeBtn = getElementByDataID('game_volume_button');
    const gameVolumeSlider = getElementByDataID('game_volume_slider');
    const gameVolumeSliderValue = getElementByDataID('game_volume_value');
    const regularSVG = getElementByDataID('game_volume_svg');
    const muteSVG = getElementByDataID('game_volume_mute_svg');
    setVolumeSliderListener(gameVolumeBtn, gameVolumeSlider, gameVolumeSliderValue,
        regularSVG, muteSVG);
}

const setSoundEffectVolumeSliderListener = () => {
    const soundEffectVolumeBtn = getElementByDataID('sound_effect_volume_button');
    const soundEffectVolumeSlider = getElementByDataID('sound_effect_volume_slider');
    const soundEffectVolumeSliderValue = getElementByDataID('sound_effect_volume_value');
    const regularSVG = getElementByDataID('sound_effect_volume_svg');
    const muteSVG = getElementByDataID('sound_effect_volume_mute_svg');
    setVolumeSliderListener(soundEffectVolumeBtn, soundEffectVolumeSlider, soundEffectVolumeSliderValue,
        regularSVG, muteSVG);
}

const initialize = () => {
    setFontSizeSliderListener();
    setCursorSizeSliderListener();
    setFontFamilyDropDown();
    setNarrationVolumeSliderListener();
    setGameVolumeSliderListener();
    setSoundEffectVolumeSliderListener();
}


const makeDraggableHeader =(header) => {
    let startAnchorX, startAnchorY; // the start position of cursor
    let offsetX, offsetY;
    let isDragging = false;

    const container = getElementByDataID('ace_demo_window');
    let startPosX, startPosY; // the start position of the panel
    const maxPosX = window.innerWidth - container.offsetWidth;
    const maxPosY = window.innerHeight - container.offsetHeight;

    header.onmousedown =(event) => {
        event.preventDefault();
        startAnchorX = event.clientX;
        startAnchorY = event.clientY;
        startPosX = (parseInt(container.style.left) || 0);
        startPosY = (parseInt(container.style.top) || 0);
        isDragging = true;
    }

    document.onmousemove = header.onmousemove =(event) => {
        if(!isDragging){
            return;
        }
        event.preventDefault();
        offsetX = event.clientX - startAnchorX;
        offsetY = event.clientY - startAnchorY;

        // make sure the whole panel inside the window
        offsetX = Math.min(Math.max(offsetX, -startPosX), maxPosX - startPosX);
        offsetY = Math.min(Math.max(offsetY, -startPosY), maxPosY - startPosY);

        container.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    document.onmouseup = header.onmouseup =(event) => {
        if(!isDragging){
            return;
        }
        container.style.left = startPosX + offsetX + 'px';
        container.style.top = startPosY + offsetY + 'px';
        container.style.transform = 'translate(0, 0)';
        offsetX = offsetY = 0;
        isDragging = false;
    }
}



document.addEventListener("DOMContentLoaded", function() {
    // If the js is accessed through popup.html, conduct query selection based on document
    // Otherwise the js is injected through content.js, query should be based on the extension root
    rootElem = document;
    console.log("DOMContentLoaded");
    initialize();

    window.onclick = function(event) {
        HideDropDown(event);
    }
});

const ace_demo_popup = document.getElementById('ace_demo_popup');
if(ace_demo_popup !== null){
    rootElem = ace_demo_popup.shadowRoot;
    initialize();

    rootElem.addEventListener('click', event => {
        HideDropDown(event);
    });

    makeDraggableHeader(getElementByDataID('header_panel'))
}

const hidePopup =() => {
    if(ace_demo_popup !== null){
        ace_demo_popup.style.display = 'none';
    }
}


// let rootObserver = new MutationObserver((mutationsList, observer) => {
//     for (let mutation of mutationsList) {
//         console.log(mutation.target + " " + mutation.addedNodes);
//     }
// });
// rootObserver.observe(rootNode.shadowRoot, { childList: true });


