
const API_BASE_URL = "https://test.alreylz.me/v1/API/"

export async function getRequestRooms() {
    const response = await fetch(API_BASE_URL + "Rooms", {
        method: "GET",
    });

    return await response.json();
}






export async function postMeasurements() {

    //Get room? the problem is I need to treat everything as if non existing necesarilly?
    //Post a measurement in its own session
    




}