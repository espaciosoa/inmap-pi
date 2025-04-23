import { initLoadScreen } from "./popup.js";


const [popupMsg, closePopup] = initLoadScreen()


export async function triggerAndSendMeasurement() {


    const roomNameInputField = document.querySelector('input[name="room-input"]')
    const roomNameSelectField = document.querySelector('select[name="room-select"]')

    //Extraigo el nombre del input field o del select field
    let roomName;

    console.log(roomNameInputField)
    console.log(roomNameSelectField)

    if (!isEmpty(roomNameInputField.value))
        roomName = roomNameInputField.value
    else if (!isEmpty(roomNameSelectField.value)) {
        const selectedText = roomNameSelectField.options[roomNameSelectField.selectedIndex].text;
        roomName = selectedText
    }
    else {
        alert("No value provided for the room selected or written")
        return new Error("No value provided for the room selected or written")
    }

    console.log("ROOM NAME", roomName)

    const request = new Request("/measureAndSend", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: roomName
        }),
    });


    popupMsg("Loading", "load")
    const response = await fetch(request)
    const data = await response.json();
    closePopup()



    if (data)
        popupMsg(`Measurement completed: ${JSON.stringify(data)}`, "ok")
    else
        popupMsg(`Measurement failed: ${JSON.stringify(data)}`, "error")
        
        


}








function isEmpty(value) {
    return value.trim() === "" || value === null || value === undefined
}