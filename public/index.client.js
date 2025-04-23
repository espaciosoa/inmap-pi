
import { showRoomsAsSelectOptions } from "./src/dynamicMarkup.js"
import { getRequestRooms } from "./src/remote.apiRequests.js"
import { triggerAndSendMeasurement } from "./src/own.apiRequests.js";
import { initLoadScreen } from "./src/popup.js";

const [popupMsg , closePopup ] = initLoadScreen()

popupMsg("Loading existing rooms", "load")
const rooms = await getRequestRooms();
console.log("Rooms", rooms)
closePopup()






const roomSelectElement = document.querySelector("#room-selector")

const state = {
    activeRoom: null
};

showRoomsAsSelectOptions(roomSelectElement, state, rooms, rooms[0])
// setInterval(() => console.log("STATE", state), 1000)


document.querySelector(".measureAndSave").addEventListener("click", () => {
    triggerAndSendMeasurement()
}
)




function createTableFromObject(data) {
    const elem = document.createElement("div");
    elem.classList.add("top-obj-group");

    const kvPairs = Object.entries(data);

    for (const [key, value] of kvPairs) {
        let kvItemHTML = document.createElement("div");
        kvItemHTML.classList.add("obj-group")

        //UGLY HACK TO SHOW KEYPAIR VALUES AT DIFFERENT LEVELS
        let valueAux = value;
        try{
            valueAux = JSON.parse(value)
        }
        catch(e){
            console.log("attempted to convert to value")
            valueAux = value;
        }


        if (isObject(valueAux)) {
            const subElem = createTableFromObject(valueAux);
            kvItemHTML.textContent = `${key}:`;
            kvItemHTML.appendChild(subElem);
        } else {

            const keyElemHtml = document.createElement("span")
            keyElemHtml.textContent = `${key}`
            keyElemHtml.classList.add("key")
            const valElemHtml = document.createElement("span")
            valElemHtml.textContent = `${valueAux}`
            valElemHtml.classList.add("val")

            kvItemHTML.append(keyElemHtml,valElemHtml)
        }

        elem.appendChild(kvItemHTML);
    }

    return elem;
}



function isObject(item) {
    return (item && typeof item === "object" && !Array.isArray(item));
}




async function getModemData() {

    popupMsg("Fetching initialization data from 5G module", "load")

    const response = await fetch('/modem-status');
    const data = await response.json();
closePopup()



    document.getElementById('modem-info').replaceChildren(createTableFromObject(data))
    
    // .innerHTML = `
    //   <strong>Serving Cell:</strong> ${JSON.stringify(data.servingCell)}<br/>
    //   <strong>APN Info:</strong> ${data.apnInfo}<br/>
    //   <strong>SIM Status:</strong> ${data.simStatus}<br/>
    //   <strong>Signal Strength:</strong> ${data.signalStrength}<br/>
    //   <strong>Network Registration:</strong> ${data.networkRegistration}<br/>
    //   <strong>Operator Info:</strong> ${data.operatorInfo}<br/>
    // `;
}

getModemData();