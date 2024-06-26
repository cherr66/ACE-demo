
/**
 * basic functionalities for maintaining the popup elements
 */
let rootElem;
const getElementByDataID = (id) => rootElem.querySelector(`[data-ace-id="${id}"]`);

let isSettingModeOn = false;
let isFeatureOn = [];
let featureControlElements = [];
const alternateHeader =() => {
    const settingHeader = getElementByDataID('header_quit_setting_container');
    settingHeader.classList.toggle('hide');
    const regularHeaderTitle = getElementByDataID('header_title');
    regularHeaderTitle.classList.toggle('hide');
    const settingBtn = getElementByDataID('header_setting_btn');
    settingBtn.classList.toggle('hide');
};

const onSettingBtnClicked =() =>{
    if(isSettingModeOn){
        return;
    }

    // prepare UI for entering setting mode
    alternateHeader();
    featureControlElements.forEach(elem => {
        elem.disabled = true; // disable controls' interactivity
    });

    const checkboxContainers = rootElem.querySelectorAll('.feature_checkbox_container');
    // isFeatureOn keep a record of visibility state of each feature control in regular mode
    if(checkboxContainers.length !== isFeatureOn.length){
        isFeatureOn.length = 0;
        checkboxContainers.forEach(c => {
            c.parentElement.classList.contains('hide')?
                isFeatureOn.push(false):
                isFeatureOn.push(true);
        });
    }

    // set checkbox state according to isFeatureON(state of each control)
    for(let i = 0; i < checkboxContainers.length; i++){
        const checkbox = checkboxContainers[i].querySelector('input[type="checkbox"]')
        checkbox.checked = isFeatureOn[i]; // set checked value accordingly
        checkbox.style.ariaChecked = isFeatureOn[i];
        checkbox.addEventListener('change', setCheckboxAriaChecked);
        checkboxContainers[i].classList.toggle('hide'); // show all checkboxes
        checkboxContainers[i].parentElement.classList.remove('hide'); // show all controls
    }
    isSettingModeOn = !isSettingModeOn;

    // If in setting mode, pressed ESC, quit setting mode
    document.addEventListener('keydown', function onKeyDown(event) {
        if (event.key === 'Escape') {
            quitSettingMode();
            document.removeEventListener('keydown', onKeyDown);
        }
    });

    const messageData = {
        sender: "popup.js",
        functionName: "onSettingModeToggled"};
    window.postMessage(messageData, window.location.href);
};

const quitSettingMode =() =>{
    if(!isSettingModeOn){
        return;
    }

    const checkboxContainers = rootElem.querySelectorAll('.feature_checkbox_container');
    for(let i = 0; i < checkboxContainers.length; i++) {
        const checkbox = checkboxContainers[i].querySelector('input[type="checkbox"]')
        checkbox.removeEventListener('change', setCheckboxAriaChecked);
        isFeatureOn[i] = checkbox.checked;
        // hide un-selected features
        isFeatureOn[i]?
            checkboxContainers[i].parentElement.classList.remove('hide'):
            checkboxContainers[i].parentElement.classList.add('hide');
    }

    // hide all checkboxes, reactive buttons/inputs, enter regular mode
    for(let i = 0; i < checkboxContainers.length; i++){
        checkboxContainers[i].classList.toggle('hide');
    }
    featureControlElements.forEach(elem => { elem.disabled = false; });
    isSettingModeOn = !isSettingModeOn;
    alternateHeader();

    const messageData = {
        sender: "popup.js",
        functionName: "onSettingModeToggled"};
    window.postMessage(messageData, window.location.href);
};

function setCheckboxAriaChecked(e){
    e.target.setAttribute('aria-checked', e.target.checked);
}

const collectFeatureControls =() => {
    const controlContainers = rootElem.querySelectorAll('.feature_control_container');
    for(let i = 0; i< controlContainers.length; i++){
        controlContainers[i].querySelectorAll('input').forEach(i => featureControlElements.push(i));
        controlContainers[i].querySelectorAll('button').forEach(b => featureControlElements.push(b));
    }
};

const setSliderFill = (element) =>{
    const value = (element.value-element.min)/(element.max-element.min)*100
    element.style.background = 'linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ' + value + '%, var(--color-base-light) ' + value + '%, var(--color-base-light) 100%)';
};

const setFontSizeSliderListener = () => {
    const fontSizeSliderValue = getElementByDataID('font_size_slider_value');
    const fontSizeSlider = getElementByDataID('font_size_slider');
    fontSizeSlider.oninput = function() {
        const value = `${(this.value * 100).toFixed(0)}%`;
        fontSizeSliderValue.innerHTML = value;
        fontSizeSlider.setAttribute('aria-valuenow', value);
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
};


const setCursorSizeSliderListener = () => {
    const cursorSizeSliderValue = getElementByDataID('cursor_size_slider_value');
    const cursorSizeSlider = getElementByDataID('cursor_size_slider');
    cursorSizeSlider.oninput = function() {
        const value = `${(this.value * 100).toFixed(0)}%`;
        cursorSizeSliderValue.innerHTML = value;
        cursorSizeSlider.setAttribute('aria-valuenow', value);

        setSliderFill(this);

        const messageData = {
            sender: "popup.js",
            functionName: "changeCursorSize",
            parameters: {
                newValue: this.value,
            }};
        window.postMessage(messageData, window.location.href);
    }
};

const setFontFamilyDropDown = () => {
    const dropdownBtn = getElementByDataID('font_family_dropdown_btn');
    const dropdown = getElementByDataID('font_family_dropdown');
    for(let i = 0; i < dropdown.children.length; i++){
        const childElem = dropdown.children[i];
        childElem.setAttribute('aria-selected', childElem.classList.contains('selected').toString());

        // set onclick function for each option
        childElem.onclick = function (event){
            event.preventDefault();
            dropdownBtn.innerHTML = childElem.innerHTML;

            // set visual cue for selected option
            const selectedElems = dropdown.getElementsByClassName('selected')
            if(selectedElems !== null){
                selectedElems[0].setAttribute('aria-selected', 'false');
                selectedElems[0].classList.remove('selected');
            }
            childElem.classList.add('selected');
            childElem.setAttribute('aria-selected', 'true');
            dropdown.setAttribute('aria-activedescendant', childElem.id);

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
                // remove arrow keys event listener
                rootElem.removeEventListener('keydown', onArrowKeysDownOnDropdown);
            }
        }
    }
};

function onArrowKeysDownOnDropdown(event) {
    const dropdownBtn = getElementByDataID('font_family_dropdown_btn');
    if(event.target !== dropdownBtn ||
        (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Enter' && event.key !== 'Tab')){
        return;
    }

    const dropdown = getElementByDataID('font_family_dropdown');
    // navigation on dropdown
    if(event.key === 'ArrowLeft' || event.key === 'ArrowRight'){
        event.preventDefault();
        const oldSelectedOption = rootElem.getElementById(dropdown.getAttribute('aria-activedescendant'));
        let newSelectedOption;
        if (event.key === 'ArrowLeft') {
            newSelectedOption = oldSelectedOption.previousElementSibling;
        }else if(event.key === 'ArrowRight'){
            newSelectedOption = oldSelectedOption.nextElementSibling;
        }
        if(newSelectedOption !== null && oldSelectedOption !== null
            && newSelectedOption !== oldSelectedOption){
            oldSelectedOption.setAttribute('aria-selected', 'false');
            oldSelectedOption.classList.remove('selected');
            newSelectedOption.setAttribute('aria-selected', 'true');
            newSelectedOption.classList.add('selected');
            dropdown.setAttribute('aria-activedescendant', newSelectedOption.id);

            if(getElementByDataID('narration_checkbox').checked){
                const messageData = {
                    sender: "popup.js",
                    functionName: "speak",
                    parameters: {
                        newValue: `${newSelectedOption.innerText},
                            ${Array.from(newSelectedOption.parentElement.children).indexOf(newSelectedOption) + 1} of ${getElementByDataID('font_family_dropdown').childElementCount}`,
                    }};
                window.postMessage(messageData, window.location.href);
            }
        }
    }

    // Confirm choice
    if(event.key === 'Enter'){
        const newFontFamily = rootElem.getElementById(dropdown.getAttribute('aria-activedescendant')).innerHTML;
        dropdownBtn.innerHTML = newFontFamily;
        // send message
        const messageData = {
            sender: "popup.js",
            functionName: "changeFontFamily",
            parameters: {
                newValue: newFontFamily,
            }};
        window.postMessage(messageData, window.location.href);

        if(getElementByDataID('narration_checkbox').checked){
            const messageData = {
                sender: "popup.js",
                functionName: "speak",
                parameters: {
                    newValue: `${newFontFamily} selected, close select`,
                }};
            window.postMessage(messageData, window.location.href);
        }
    }

    // toggle off dropdown if it loses focus
    if(event.key === 'Tab'){
        if (!dropdown.classList.contains('hide')){
            dropdown.classList.add('hide');
        }
    }
}

const toggleDropdown =() => {
    if(isSettingModeOn){
        return;
    }
    const dropdown = getElementByDataID('font_family_dropdown');
    const containHide = dropdown.classList.toggle("hide");
    getElementByDataID("font_family_dropdown_btn").setAttribute('aria-expanded', String(!containHide));

    // arrow keys event listener
    if(!containHide){
        rootElem.addEventListener('keydown', onArrowKeysDownOnDropdown);

        if(getElementByDataID('narration_checkbox').checked){
            const messageData = {
                sender: "popup.js",
                functionName: "speak",
                parameters: {
                    newValue: `open select, ${getElementByDataID('font_family_dropdown').childElementCount} options`,
                }};
            window.postMessage(messageData, window.location.href);
        }
    }
};

const HideDropDown =(clickEvent) =>{
    const targetDataID = clickEvent.target.getAttribute('data-ace-id');
    // close dropdown if blank area is clicked
    if(targetDataID !== 'font_family_dropdown_btn'){
        const dropdown = getElementByDataID('font_family_dropdown');
        if (!dropdown.classList.contains('hide')){
            dropdown.classList.add('hide');
        }
        getElementByDataID("font_family_dropdown_btn").setAttribute('aria-expanded', 'false');
    }
};

const onMagnifierCheckboxChanged =(checkbox) => {
    if(isSettingModeOn){
        return;
    }
    const messageData = {
        sender: "popup.js",
        functionName: "toggleMagnifier",
        parameters: {
            newValue: checkbox.checked
        }};
    window.postMessage(messageData, window.location.href);
    checkbox.checked = false;
};

const onHighlightCheckboxChanged =(checkbox) => {
    if(isSettingModeOn){
        return;
    }

    const messageData = {
        sender: "popup.js",
        functionName: "toggleHighlight",
        parameters: {
            newValue: checkbox.checked
        }};
    window.postMessage(messageData, window.location.href);
};

const onHighlightBorderCheckboxChanged =(checkbox) =>{
    if(!checkbox){
        return;
    }
    const sibling = Array.from(checkbox.parentElement.querySelectorAll('input[type="checkbox"]')).filter(element => element !== checkbox)[0];
    sibling.checked = !checkbox.checked;

    const messageData = {
        sender: "popup.js",
        functionName: "setHighlightBorderAnimation",
        parameters: {
            newValue: checkbox.parentElement.querySelector('[data-ace-id="highlight_border_flashing"]').checked
        }};
    window.postMessage(messageData, window.location.href);
};

const setHighlightBorderCheckboxEventListener =() =>{
    const noAnimation = getElementByDataID('highlight_border_no_animation');
    const flashing = getElementByDataID('highlight_border_flashing');
    noAnimation.addEventListener('keyup', (event) => {
        if(event.key === 'Enter'){
            flashing.checked = !noAnimation.checked;
            postMessage();
        }
    });
    flashing.addEventListener('keyup', (event) => {
        if(event.key === 'Enter'){
            noAnimation.checked = !flashing.checked;
            postMessage();
        }
    });

    function postMessage(){
        const messageData = {
            sender: "popup.js",
            functionName: "setHighlightBorderAnimation",
            parameters: {
                newValue: flashing.checked
            }};
        window.postMessage(messageData, window.location.href);
    }
}

const onNarrationCheckboxChanged =(checkbox) => {
    if(isSettingModeOn){
        return;
    }

    const messageData = {
        sender: "popup.js",
        functionName: "toggleNarration",
        parameters: {
            newValue: checkbox.checked
        }};
    window.postMessage(messageData, window.location.href);

    // if(checkbox.checked && getElementByDataID('ARIA_optimization_checkbox').checked){
    //     alert('It is not recommended to use Narration and other Screen Readers at the same time');
    // }
};

const onARIAOptimizationCheckboxChanged =(checkbox) => {
    if(isSettingModeOn){
        return;
    }

    const messageData = {
        sender: "popup.js",
        functionName: "toggleARIAOptimization",
        parameters: {
            newValue: checkbox.checked
        }};
    window.postMessage(messageData, window.location.href);
};

const onSonificationCheckboxChanged =(checkbox) => {
    if(isSettingModeOn){
        return;
    }

    const messageData = {
        sender: "popup.js",
        functionName: "toggleSonification",
        parameters: {
            newValue: checkbox.checked
        }};
    window.postMessage(messageData, window.location.href);
    checkbox.checked = false;
};

const onSonificationSFXCheckboxChanged =(checkbox) => {
    if(!checkbox){
        return;
    }
    const sibling = Array.from(checkbox.parentElement.querySelectorAll('input[type="checkbox"]')).filter(element => element !== checkbox)[0];
    sibling.checked = !checkbox.checked;

    const messageData = {
        sender: "popup.js",
        functionName: "setSonificationSFX",
        parameters: {
            newValue: checkbox.parentElement.querySelector('[data-ace-id="sonification_sfx_1"]').checked
        }};
    window.postMessage(messageData, window.location.href);
};

const setSonificationSFXCheckboxEventListener =() =>{
    const sfx1 = getElementByDataID('sonification_sfx_1');
    const sfx2 = getElementByDataID('sonification_sfx_2');
    sfx1.addEventListener('keyup', (event) => {
        if(event.key === 'Enter'){
            sfx2.checked = !sfx1.checked;
            postMessage();
        }
    });
    sfx2.addEventListener('keyup', (event) => {
        if(event.key === 'Enter'){
            sfx1.checked = !sfx2.checked;
            postMessage();
        }
    });

    function postMessage(){
        const messageData = {
            sender: "popup.js",
            functionName: "setSonificationSFX",
            parameters: {
                newValue: sfx1.checked
            }};
        window.postMessage(messageData, window.location.href);
    }
}

const onSonificationStrategyCheckboxChanged =(checkbox) => {
    if(!checkbox){
        return;
    }
    const sibling = Array.from(checkbox.parentElement.querySelectorAll('input[type="checkbox"]')).filter(element => element !== checkbox)[0];
    if(!checkbox.checked && !sibling.checked){
        sibling.checked = true;
    }

    const messageData = {
        sender: "popup.js",
        functionName: "setSonificationStrategy",
        parameters: {
            newValue: {volumeBased: checkbox.checked, tempoBased: sibling.checked},
        }};
    window.postMessage(messageData, window.location.href);
};

const setSonificationStrategyCheckboxEventListener =() =>{
    const volumeBased = getElementByDataID('sonification_volume_based');
    const tempoBased = getElementByDataID('sonification_tempo_based');
    volumeBased.addEventListener('keyup', (event) => {
        if(event.key === 'Enter'){
            if(!volumeBased.checked && !tempoBased.checked){
                tempoBased.checked = true;
            }
            postMessage();
        }
    });
    tempoBased.addEventListener('keyup', (event) => {
        if(event.key === 'Enter'){
            if(!volumeBased.checked && !tempoBased.checked){
                volumeBased.checked = true;
            }
            postMessage();
        }
    });

    function postMessage(){
        const messageData = {
            sender: "popup.js",
            functionName: "setSonificationStrategy",
            parameters: {
                newValue: {volumeBased: volumeBased.checked, tempoBased: tempoBased.checked},
            }};
        window.postMessage(messageData, window.location.href);
    }
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
        const value = `${(this.value * 1).toFixed(0).toString()}`;
        volumeSliderValue.innerHTML = value;
        volumeSlider.setAttribute('aria-valuenow', value);

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
};

const setNarrationVolumeSliderListener = () => {
    const narrationVolumeBtn = getElementByDataID('narration_volume_button');
    const narrationVolumeSlider = getElementByDataID('narration_volume_slider');
    const narrationVolumeSliderValue = getElementByDataID('narration_volume_value');
    const regularSVG = getElementByDataID('narration_volume_svg');
    const muteSVG = getElementByDataID('narration_volume_mute_svg');

    function postVolumeMessage(value){
        const messageData = {
            sender: "popup.js",
            functionName: "setNarrationVolume",
            parameters: {
                newValue: value,
            }};
        window.postMessage(messageData, window.location.href);
    }
    narrationVolumeBtn.addEventListener('click', () => {
        // This callback is fired after the other registered function, so mute value is real-time
        if(muteSVG.classList.contains('hide')){
            postVolumeMessage(0);
        }else{
            postVolumeMessage(narrationVolumeSlider.value);
        }
    });
    narrationVolumeSlider.addEventListener('input', () => {
        postVolumeMessage(narrationVolumeSlider.value);
    });
    setVolumeSliderListener(narrationVolumeBtn, narrationVolumeSlider, narrationVolumeSliderValue,
        regularSVG, muteSVG);

    const initialVolume = 50;
    muteSVG.classList.add('hide');
    regularSVG.classList.remove('hide');
    narrationVolumeSlider.value = initialVolume;
    narrationVolumeSliderValue.innerHTML = initialVolume.toString();
    setSliderFill(narrationVolumeSlider);
    postVolumeMessage(initialVolume); //make sure narrationVolume in content-utils.js be consistent
};

const setGameVolumeSliderListener = () => {
    const gameVolumeBtn = getElementByDataID('game_volume_button');
    const gameVolumeSlider = getElementByDataID('game_volume_slider');
    const gameVolumeSliderValue = getElementByDataID('game_volume_value');
    const regularSVG = getElementByDataID('game_volume_svg');
    const muteSVG = getElementByDataID('game_volume_mute_svg');
    setVolumeSliderListener(gameVolumeBtn, gameVolumeSlider, gameVolumeSliderValue,
        regularSVG, muteSVG);
};

const setSonificationVolumeSliderListener = () => {
    const sonificationVolumeBtn = getElementByDataID('sonification_volume_button');
    const sonificationVolumeSlider = getElementByDataID('sonification_volume_slider');
    const sonificationVolumeSliderValue = getElementByDataID('sonification_volume_value');
    const regularSVG = getElementByDataID('sonification_volume_svg');
    const muteSVG = getElementByDataID('sonification_volume_mute_svg');
    setVolumeSliderListener(sonificationVolumeBtn, sonificationVolumeSlider, sonificationVolumeSliderValue,
        regularSVG, muteSVG);
};

const setControlsNavigation =() => {
    // make checkboxes able to receive keyboard enter event
    const checkboxes = rootElem.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(c => {
        c.addEventListener('keypress', function (event){
            if (event.key === 'Enter') {
                c.checked = !c.checked;
                if (typeof this.onchange === "function") {
                    this.onchange();
                }

                // If narration is ON, speak its content.
                if(getElementByDataID('narration_checkbox').checked){
                    const messageData = {
                        sender: "popup.js",
                        functionName: "speak",
                        parameters: {
                            newValue: (c.checked)?'checked':'not checked',
                        }};
                    window.postMessage(messageData, window.location.href);
                }
            }
        });
    });

    const sliders = rootElem.querySelectorAll('input[type="range"]');
    sliders.forEach(s => {
        s.addEventListener('keydown', function (event){
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                // If narration is ON, speak its content.
                if(getElementByDataID('narration_checkbox').checked){
                    console.log(s.value , parseFloat(s.step));
                    console.log(parseFloat(s.value) + parseFloat(s.step));
                    console.log(Math.min(parseFloat(s.value) + parseFloat(s.step), s.max));
                    const messageData = {
                        sender: "popup.js",
                        functionName: "speak",
                        parameters: {
                            newValue: s.ariaValueNow.replace(s.value, ((event.key === 'ArrowLeft')?
                                Math.max(parseFloat(s.value) - parseFloat(s.step), s.min):
                                Math.min(parseFloat(s.value) + parseFloat(s.step), s.max)).toString()),
                        }};
                    window.postMessage(messageData, window.location.href);
                }
            }
        });
    });
}

const initialize = () => {
    setFontSizeSliderListener();
    setCursorSizeSliderListener();
    setFontFamilyDropDown();
    setNarrationVolumeSliderListener();
    setHighlightBorderCheckboxEventListener();
    setSonificationSFXCheckboxEventListener();
    setSonificationStrategyCheckboxEventListener();
    // setGameVolumeSliderListener();
    // setSonificationVolumeSliderListener();
    collectFeatureControls();
    setControlsNavigation();
};


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
};



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
    if(isSettingModeOn){
        quitSettingMode();
    }
    if(ace_demo_popup !== null){
        ace_demo_popup.style.display = 'none';
    }
};

window.addEventListener("message", (event)=>{
    if(!window.location.href.startsWith(event.origin)){
        return;
    }
    if(event.data.code === "QUIT_SETTING"){
        hidePopup();
    }
});