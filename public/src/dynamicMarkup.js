import JSUtils from "./JSUtils.js"


export function showRoomsAsSelectOptions(selectItem, state, rooms, selected = undefined) {

    const roomOptionHtmlTemplate = `<option 
        data-type="room"    
        value={{roomId}}
        data-id={{roomId}}>
            {{roomName}}
        </option>`

    const defaultOption =`<option value="" selected disabled hidden>Select a preexisting room</option>`


    const allRoomsAsOptions = []

    rooms.forEach(r => {

        const myOptionFilledTemplate = JSUtils.replaceTemplatePlaceholders(roomOptionHtmlTemplate,
            {
                roomId: r._id,
                roomName: r.name
            });

        const optionNode = JSUtils.txtToHTMLNode(myOptionFilledTemplate)

        allRoomsAsOptions.push(JSUtils.txtToHTMLNode(defaultOption))

        //set selected by default if any
        console.log("SETTING SELECTED", selected)
        if (selected && selected._id === r._id)
            optionNode.selected = true;

        //Event subscriptions
        selectItem.addEventListener("change", (ev) => {
            
            const roomIdSelected = ev.target.value
            state.activeRoom = rooms.filter(r => r._id == roomIdSelected)[0]
        })

        allRoomsAsOptions.push(optionNode)

    })

    selectItem.replaceChildren(...allRoomsAsOptions)

}
