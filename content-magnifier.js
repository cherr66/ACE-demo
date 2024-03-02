
function toggleMagnifier(newValue){
    if(!newValue){
        return;
    }

    togglePopup();
    // TODO BUG: without this time delay, a cached screenshot with popup will be captured
    // window.requestAnimationFrame(retrieveScreenshotURL);
    setTimeout(retrieveScreenshotURL, 50);

    function retrieveScreenshotURL(){
        chrome.runtime.sendMessage({code: "GET_CAPTURED_TAB"})
            .then(function(response) {
                if(response.code === "SUCCESS"){
                    chrome.runtime.onMessage.addListener(setupMagnifier);
                }
            });
    }
}

let magnifierRoot; // root node for magnifier
let magnifierRootID = 'ace_demo_magnifier'; // TODO change name

function setupMagnifier(request, sender){
    if(request.code !== "GET_CAPTURED_TAB_RESPONSE"){
        return;
    }
    const magnifyPower = 2 * request.zoom;
    const magnifierRadius = 100;
    chrome.runtime.onMessage.removeListener(setupMagnifier);

    // let newTab = window.open();
    // newTab.document.write('<img src="' + request.data_url + '" alt="Image">');

    magnifierRoot = document.createElement('div');
    magnifierRoot.setAttribute('id', magnifierRootID);
    magnifierRoot.style.position = 'relative';
    magnifierRoot.setAttribute('style',
        'z-index: 2147483647;' +
        'position: fixed;' +
        'overflow: hidden;' +
        'top: 0;!important;' +
        'left: 0;!important;' +
        'width: 100%;' +
        'height: 100%;');
    document.documentElement.appendChild(magnifierRoot);

    const glass = document.createElement("div");
    glass.tabIndex = 0;
    glass.setAttribute('style',
        'position: absolute;' +
        'border: 5px solid #fff;' +
        'border-radius: 50%;' +
        'cursor: none;' +
        `width: ${magnifierRadius * 2}px;` +
        `height: ${magnifierRadius * 2}px;`);
    magnifierRoot.appendChild(glass);
    glass.style.background = "url('" + request.data_url + "')";
    glass.style.imageRendering = "auto";
    glass.style.backgroundRepeat = "no-repeat";
    glass.style.backgroundSize = `${ window.innerWidth * magnifyPower}px ${ window.innerHeight * magnifyPower}px`;

    // force the glass to spawn at current cursor position
    magnifierRoot.addEventListener("mouseenter", onCursorEnterMagnifierRoot);
    function onCursorEnterMagnifierRoot(event){
        moveMagnifier(event);
        glass.focus();
        magnifierRoot.removeEventListener("mouseenter", onCursorEnterMagnifierRoot);
    }

    magnifierRoot.addEventListener("mousemove", moveMagnifier);
    function moveMagnifier(event) {
        event.preventDefault();
        // Ensure the magnifying glass stays within the viewport boundaries
        let glassPosX = constrainNumber(event.clientX - glass.offsetWidth / 2, -glass.offsetWidth / 2, window.innerWidth);
        let glassPosY = constrainNumber(event.clientY - glass.offsetHeight / 2, -glass.offsetHeight / 2, window.innerHeight);
        // Set the center of glass align with the cursor position
        glass.style.left = `${glassPosX}px`;
        glass.style.top = `${glassPosY}px`;
        // Set the center of the displaying portion align with cursor position (clientXY)
        let offsetX = -1 * (event.clientX) * magnifyPower + glass.offsetWidth / 2;
        let offsetY = -1 * (event.clientY) * magnifyPower + glass.offsetHeight / 2;
        glass.style.backgroundPosition = offsetX + "px " + offsetY + "px";
    }

    // close magnifying glass if detects the following actions:
    glass.addEventListener("wheel", closeMagnifier);
    glass.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeMagnifier();
        }
    });
    glass.addEventListener("click", closeMagnifier);
    function closeMagnifier() {
        magnifierRoot.remove();
        togglePopup();
        // set magnifier focused, ease navigation
        root.shadowRoot.querySelector('[data-ace-id="magnifier_toggle"]').focus();
    }
}
