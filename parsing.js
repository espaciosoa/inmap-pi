// This file includes all the parsing into named key-value pairs of the AT results


//------------------------------------
// CONSTANTS >>
//-----------------------------------
// Possible values for the stat property of the netregistration state
const statValues = new Map([
    [0, "Not registered, not searching"],
    [1, "Registered (home network)"],
    [2, "Not registered, searching"],
    [3, "Registration denied"],
    [4, "Unknown"],
    [5, "Registered, roaming"]
])

//Possible (most common) access technologies int codes and their meaning
const accessTechnologies = new Map([
    [0, "GSM (2G)"],
    [2, "UTRAN (3G)"],
    [3, "GSM w/ EGPRS (2.5G EDGE)"],
    [7, "LTE"],
    [13, "LTE Cat-M1"],
    [14, "NB-IoT (Narrowband LTE)"],
    [19, "5G NR (Standalone, SA)"],
    [20, "5G NR (Non-Standalone, NSA) - Uses 4G+5G together"]
])








function parsePDPContextDefinitions(atResult) {

    // Takes an array of PDP ContextDefinitions and destructures it into labeled elements
    // - contextId
    // - PDPType (PDP Type (IPv4, IPv6, or both))
    // - APN (Access Point Name)
    // - PDP address (your IP) — 0.0.0... here means not connected / empty
    // 5-8 (data compression, header compression ...)
    // 9+ optional fields


    return atResult.map(line => {
        const parts = line.split(',');

        return {
            cid: parseInt(parts[0]),
            pdpType: parts[1].replace(/"/g, ''),
            apn: parts[2].replace(/"/g, ''),
            ipAddress: parts[3].replace(/"/g, ''),
            // Optional: you can extract more if needed
            dComp: parts[4],
            hComp: parts[5],
            ipv4AddrAlloc: parts[6],
            // Returning the full string just as reference for debugging
            all: line
        };
    });
}



function parseNetRegitrationState(atResult) {

    const items = atResult.split(",")

    return {
        // URC (Unsolicited Result Code)
        urc: items[0], 
        // Registration status
        stat: statValues.get(Number.parseInt( 
            items[1]
        )),
        // Tracking Area Code (TAC)
        tac: items[2],
        // Cell ID
        cellId: items[3],
        // Access Technology Used
        accessTechnology:
            accessTechnologies.get(Number.parseInt(items[4]))
    }
}


function parseServingCell(atResult) {
    const match = atResult.match(/\s*"servingcell",(.*)/);
    if (!match) return null;

    const parts = match[1].split(',');

    return {
        state: parts[0].replace(/"/g, ''),
        rat: parts[1].replace(/"/g, ''),
        mcc: parts[2],
        mnc: parts[3],
        lac: parts[4],
        cellId: parts[5],
        uarfcn: parts[6],
        psc: parts[7],
        rscpLevel: parts[8],
        rscp: parts[9],
        ecIo: parts[10],
        extra: parts.slice(11), // optional unused fields
    };
}



module.exports = {
    parsePDPContextDefinitions,
    parseNetRegitrationState,
    parseServingCell
}