
import { showRoomsAsSelectOptions } from "./src/dynamicMarkup.js"
import { getRequestRooms } from "./src/remote.apiRequests.js"
// import { } from "./src/own.apiRequests"







const rooms = await getRequestRooms();
console.log("Rooms", rooms)


const roomSelectElement = document.querySelector("#room-selector")

const state = {
    activeRoom: null
};

showRoomsAsSelectOptions(roomSelectElement, state, rooms, rooms[0])

// setInterval(() => console.log("STATE", state), 1000)

document.querySelector("#tests").addEventListener("click", async () => {
    const response = await fetch('/connect');
    console.log(await response.json())
}
);

document.querySelector("#measure").addEventListener("click",

    async () => {
        const response = await fetch('/measure');
        console.log(response)
        alert(await response.json())
    }
)












async function getModemData() {
    const response = await fetch('/modem-status');
    const data = await response.json();

    document.getElementById('modem-info').innerHTML = `
      <strong>Serving Cell:</strong> ${JSON.stringify(data.servingCell)}<br/>
      <strong>APN Info:</strong> ${data.apnInfo}<br/>
      <strong>SIM Status:</strong> ${data.simStatus}<br/>
      <strong>Signal Strength:</strong> ${data.signalStrength}<br/>
      <strong>Network Registration:</strong> ${data.networkRegistration}<br/>
      <strong>Operator Info:</strong> ${data.operatorInfo}<br/>
    `;
}

getModemData();