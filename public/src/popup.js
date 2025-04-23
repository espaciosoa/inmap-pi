import JSUtils from "./JSUtils.js"


export function initLoadScreen() {

    const popupTemplate = `
    <div class="modal-wrapper" >
    <div class="modal-bg-page-cover"></div>
    <div class="my-load-popup">
        <svg class="loading-svg rotate" width="{{iconSize}}" height="{{iconSize}}" viewBox="0 0 24 24" fill="currentColor">
        <path
            d="M14.1 3.1c0 1.1-1 2-2.1 2s-2.1-0.9-2.1-2 1-2.1 2.1-2.1 2.1 0.9 2.1 2.1z m-2.1 15.8c1.1 0 2.1 0.9 2.1 2s-1 2.1-2.1 2.1-2.1-0.9-2.1-2.1 1-2 2.1-2z m8.9-9c1.2 0 2.1 1 2.1 2.1s-0.9 2.1-2.1 2.1-2-1-2-2.1 0.9-2.1 2-2.1z m-15.8 2.1c0 1.1-0.9 2.1-2 2.1s-2.1-1-2.1-2.1 0.9-2.1 2.1-2.1 2 1 2 2.1z m0.6 4.3c1.1 0 2 0.9 2 2 0 1.2-0.9 2.1-2 2.1s-2.1-0.9-2.1-2.1 0.9-2 2.1-2z m12.6 0c1.2 0 2.1 0.9 2.1 2 0 1.2-0.9 2.1-2.1 2.1s-2-0.9-2-2.1 0.9-2 2-2z m-12.6-12.7c1.1 0 2 0.9 2 2.1s-0.9 2-2 2-2.1-0.9-2.1-2 0.9-2.1 2.1-2.1z">
        </path>

        </svg>
        <svg class="ok-svg" width="{{iconSize}}" height="{{iconSize}}" viewBox="0 0 48 48" version="1" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 48 48" fill="currentColor"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle fill="currentColor" cx="24" cy="24" r="21"></circle> <polygon fill="white" points="34.6,14.6 21,28.2 15.4,22.6 12.6,25.4 21,33.8 37.4,17.4"></polygon> </g></svg>
        <svg class="error-svg" width="{{iconSize}}" height="{{iconSize}}"  viewBox="0 0 25 25"  version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>cross</title> <desc>Created with Sketch Beta.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="currentColor" fill-rule="evenodd" sketch:type="MSPage"> <g id="Icon-Set-Filled" sketch:type="MSLayerGroup" transform="translate(-469.000000, -1041.000000)" fill="currentColor"> <path d="M487.148,1053.48 L492.813,1047.82 C494.376,1046.26 494.376,1043.72 492.813,1042.16 C491.248,1040.59 488.712,1040.59 487.148,1042.16 L481.484,1047.82 L475.82,1042.16 C474.257,1040.59 471.721,1040.59 470.156,1042.16 C468.593,1043.72 468.593,1046.26 470.156,1047.82 L475.82,1053.48 L470.156,1059.15 C468.593,1060.71 468.593,1063.25 470.156,1064.81 C471.721,1066.38 474.257,1066.38 475.82,1064.81 L481.484,1059.15 L487.148,1064.81 C488.712,1066.38 491.248,1066.38 492.813,1064.81 C494.376,1063.25 494.376,1060.71 492.813,1059.15 L487.148,1053.48" id="cross" sketch:type="MSShapeGroup"> </path> </g> </g> </g></svg>
        <svg class="info-svg" viewBox="0 0 24 24" width="{{iconSize}}" height="{{iconSize}}" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="12" cy="12" r="10" stroke="#1C274C" stroke-width="1.5"></circle> <path d="M12 17V11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"></path> <circle cx="1" cy="1" r="1" transform="matrix(1 0 0 -1 11 9)" fill="#1C274C"></circle> </g></svg>
        <p class="loading-text hide-scrollbar">Cargando...</p>
    </div>
    </div>`




    const popupTemplate_Filled = JSUtils.replaceTemplatePlaceholders(popupTemplate,
        {
            iconSize: "2em"
            //Here i could add initial configurations
        });

    const popupNode = JSUtils.txtToHTMLNode(popupTemplate_Filled)

    document.body.appendChild(popupNode)



    const POPUP_SCREEN = popupNode.querySelector(".my-load-popup")
    const POPUP_SCREEN_TEXT = popupNode.querySelector(".loading-text")


    // Popup icons 
    const LOADING_SVG = popupNode.querySelector(".loading-svg")
    const ERROR_SVG = popupNode.querySelector(".error-svg")
    const INFO_SVG = popupNode.querySelector(".info-svg")
    const OK_SVG = popupNode.querySelector(".ok-svg")






    function showPopup(text, type) {


        const msgTypeClasses = ["error", "ok", "info", "load", "success"]
        const svgElems = {
            load: LOADING_SVG,
            ok: OK_SVG,
            error: ERROR_SVG,
            info: INFO_SVG
        }

        POPUP_SCREEN.classList.remove(...msgTypeClasses)
        Object.entries(svgElems).forEach((elem) => {
            elem[1].classList.remove("show")
        });

        switch (type) {
            case "load":
                POPUP_SCREEN.classList.add("load")
                svgElems["load"].classList.add("show")
                break;
            case "error":
                POPUP_SCREEN.classList.add("error")
                svgElems["error"].classList.add("show")
                break;
            case "ok":
                POPUP_SCREEN.classList.add("ok")
                svgElems["ok"].classList.add("show")
                break;
            case "info":
            default:
                POPUP_SCREEN.classList.add("info")
                svgElems["info"].classList.add("show")

        }

        POPUP_SCREEN.classList.add("open")
        POPUP_SCREEN_TEXT.innerText = text || "Something is going on..."



    }
    function hidePopup() {
        POPUP_SCREEN_TEXT.innerText = ""
        POPUP_SCREEN.classList.remove("open")
    }
    popupNode.querySelector(".modal-bg-page-cover").addEventListener("click", ()=> {hidePopup()})


    return [showPopup, hidePopup];
}
