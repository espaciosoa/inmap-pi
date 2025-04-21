/**
 * This file includes all the parsing into Javascript structures of the AT Command results to ease understanding and usage
 * I used as reference the AT command reference of the Quectel x    : https://files.waveshare.com/upload/8/8a/Quectel_RG520N%26RG52xF%26RG530F%26RM520N%26RM530N_Series_AT_Commands_Manual_V1.0.0_Preliminary_20220812.pdf
*/
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




function parseDeviceInfo(atResult) {

    return {
        brand: atResult[0],
        model: atResult[1],
        firmwareVersion: atResult[2],
    }

}

/**
 * Parses the active configurations of the modem.
 * Use in conjunction with the `AT&V` command
 * 
 * Active configurations are the settings that are currently in use by the modem 
 * Retuns an array of objects with the following properties: {key, explanation, value}
 * @param {Array} atResult - The result of the AT command as an array of strings.
 * @returns {Array} - An array of objects representing the active configurations. 

*/
function parseActiveConfigurations(atResult) {

    if (!Array.isArray(atResult)) {
        atResult = [atResult]
    }

    return atResult.map(elem => {
        const keyPairVals = elem.split(":").map(val => val.trim());

        switch (keyPairVals[0]) {
            case "&C":
                return {
                    key: "&C",
                    explanation: "DCD (Data Carrier Detect) behavior",
                    value: keyPairVals[1]
                }
            case "&D":
                return {
                    key: "&D",
                    explanation: "DTR (Data Terminal Ready) behavior",
                    value: keyPairVals[1]
                }
            case "&F":
                return {
                    key: "&F",
                    explanation: "Load factory defaults (0 = no reset)",
                    value: keyPairVals[1]
                }
            case "&W":
                return {
                    key: "&W",
                    explanation: "Save current configuration to profile - non-volatile memory (0 = not saved)",
                    value: keyPairVals[1]
                }
            case "E":
                return {
                    key: "E",
                    explanation: "Echo (0 = no echo). Commands will return the same value as sent as the first thing (should be disabled for automated execution - like with this script)",
                    value: keyPairVals[1]
                }
            case "Q":
                return {
                    key: "Q0",
                    explanation: "Result codes enabled /quiet mode (0 = no result codes)",
                    value: keyPairVals[1]
                }
            case "V":
                return {
                    key: "V",
                    explanation: "Result codes format (0 = numeric, 1 = verbose)",
                    value: keyPairVals[1]
                }
            case "X":
                return {
                    key: "X",
                    explanation: "Extended result codes (0 = no extended result codes)",
                    value: keyPairVals[1]
                }
            case "Z":
                return {
                    key: "Z",
                    explanation: "Reset to factory defaults (0 = no reset)",
                    value: keyPairVals[1]
                }
            case "S0":
                return {
                    key: "S0",
                    explanation: "Auto answer  on call(0 = no auto answer)",
                    value: keyPairVals[1]
                }
            case "S3":
                return {
                    key: "S3",
                    explanation: "Carriage return / Escape character (default is ASCII 13)",
                    value: keyPairVals[1]
                }
            case "S4":
                return {
                    key: "S4",
                    explanation: "Line feed / Escape character (default is ASCII 10)",
                    value: keyPairVals[1]
                }
            case "S5":
                return {
                    key: "S5",
                    explanation: "Backspace / Escape character (default is ASCII 8)",
                    value: keyPairVals[1]
                }
            case "S6":
                return {
                    key: "S6",
                    explanation: "Wait time before dial (in seconds, default is 2 seconds)",
                    value: keyPairVals[1]
                }
            case "S7":
                return {
                    key: "S7",
                    explanation: "Wait time for carrier (default is 0 seconds)",
                    value: keyPairVals[1]
                }
            case "S8":
                return {
                    key: "S8",
                    explanation: "Pause time for comma in dial string (default is 2 seconds)",
                    value: keyPairVals[1]
                }
            case "S10":
                return {
                    key: "S10",
                    explanation: "Lost carrier to hangup delay (in 1/10 sec)",
                    value: keyPairVals[1]
                }
            default:
                return {
                    key: keyPairVals[0],
                    explanation: "Unknown",
                    value: keyPairVals[1]
                }
        }
    })

}



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





/**
 * Main function to parse the serving cell information.
 * It handles both single and multiple cell results. 
 * @param {*} atResult results of the AT command
 * @returns Object - An object containing the parsed serving cell information.
 */
function parseServingCell(atResult) {



    if (!Array.isArray(atResult)) {
        atResult = [atResult]
    }


    //First line of result should say "servingcell"
    const match = atResult[0].match(/\s*"servingcell",(.*)/);
    if (!match) {
        throw new Error("Invalid AT command result format. Check the code");
    }


    let state;

    const getStateExplanation = (_state) => {
        switch (_state) {
            case "SEARCH":
                return "UE is searching but could not (yet) find a suitable 3G/4G/5G cell"
            case "LIMSRV":
                return "UE is camping on a cell but has not registered on the network"
            case "NOCONN":
                return "UE is camping on a cell and has registered on the network and it is in idle mode"
            case "CONNECT":
                return "UE is camping on a cell and has registered on the network and a call is in progress"
            default:
                return "Unknown (you may want to check the code)"
        }
    }
    //if there is a single cell the shape is like this
    // "servingcell","NOCONN","LTE","FDD",214,07,290580A,465,1301,3,5,5,40D8,-100,-14,-63,10,0,-,23
    if (atResult.length == 1) {

        const singleCellAll = atResult[0].split(",");
        state = singleCellAll[1].replace(/"/g, '') // Should be the state , right after "serving cell"
        const mode = singleCellAll[2].replace(/"/g, '') // Should be the operation mode, that dictates how , right after "state", either "NR5G-SA" (SA in the document) or"LTE" or "WCDMA"
        // Delete the first two elements that have been processed
        singleCellAll.shift()
        singleCellAll.shift()

        return {
            state: state,
            stateExplanation: getStateExplanation(state),
            mode: mode,
            cells: [parseSingleCell(singleCellAll, mode)]
        }
    }
    else {
        //Remove first line
        const singleCellAll = atResult[0].split(",")
        atResult.shift()

        state = singleCellAll[1].replace(/"/g, '');

        const cells = atResult.map(cellRaw => {
            //Get cell as array
            const singleCellAll = cellRaw.split(",")
            return parseSingleCell(singleCellAll, "EN-DC")
        })

        return {
            state: state,
            stateExplanation: getStateExplanation(state),
            mode: "EN-DC",
            cells: cells
        }

    }

}



/**
 * Parses a single cell from the serving cell result.
 * @param {Array} parts - The parts of the cell information.   
 * @param {string} mode The mode of the cell to process - Depends on the number of lines returned and the value of the first item after <state> ( "NR5G-SA", "EN-DC", "LTE", "WCDMA" ).
 * (see page 95 / 253 of the Quectel AT command reference)
 * @returns {Object} - An object representing the parsed cell information.
 */
function parseSingleCell(parts, mode) {


    try {
        switch (mode) {

            case "NR5G-SA" /* AKA SA */:
                return {
                    accessTechnology: parts[0].replace(/"/g, ''),
                    duplex_mode: parts[1].replace(/"/g, ''), // TDD or FDD
                    mcc: parts[2], //Mobile Country Code (first part of the PLMN code)
                    mnc: parts[3], // Mobile Network Code (second part of the PLMN code)
                    cellId: parts[4],
                    pcid: parts[5], // Pysical Cell ID
                    tac: parts[6], //Tracking Area Code
                    arfcn: parts[7], // SA-ARFCN of the cell that was scanned
                    band: parts[8], //Frequency band in 5G NR SA network mode
                    nr_dl_bandwidth: parts[9],  //DL bandwidth (see document for validation if you ever need it (page 97/253 ))
                    rsrp: getValidOrDefault(parts[10], -140, -44, "Invalid Reference Signal Received Power"), // It indicates the signal of LTE Reference Signal Received Power (range [-140,-44dBm])
                    rsrq: getValidOrDefault(parts[11], -20, -3, "Invalid Reference Signal Received Quality"), //  Reference Signal Received Quality 
                    sinr: getValidOrDefault(parts[12], -20, 30, "Invalid Signal to Interference plus Noise Ratio"), // Signal to Interference plus Noise Ratio (SINR) (range [-20,30dB])
                    scs: parts[13], //NR sub-carrier space (0: 15kHz, 1: 30kHz, 2: 60kHz, 3: 120kHz, 4: 240kHz)
                    srxlev: parts[14] //Suitable reception level for inter frequency cell
                }

            case "EN-DC":

                const accessTechnology = parts[0].replace(/"/g, '')

                if (accessTechnology == "LTE")
                    return {
                        accessTechnology: accessTechnology,
                        is_tdd: parts[1], // TDD or FDD
                        mcc: parts[2], // Mobile Country Code (first part of the PLMN code)
                        mnc: parts[3], // Mobile Network Code  (second part of the PLMN code)
                        cellId: parts[4],
                        pcid: parts[5],/// Physical Cell Id
                        earfcn: parts[6], // UTRA-ARFCN of the cell that was scanned
                        freq_band_ind: parts[7], // E-UTRA frequency band
                        ul_bandwidth: parts[8], // UL bandwidth (0: 1.4MHz, 1: 3MHz, 2: 5MHz, 3: 10MHz, 4: 15MHz, 5: 20MHz)
                        dl_bandwidth: parts[9], // DL bandwidth (0: 1.4MHz, 1: 3MHz, 2: 5MHz, 3: 10MHz, 4: 15MHz, 5: 20MHz)
                        tac: parts[10], // Tracking Area Code
                        rsrp: getValidOrDefault(parts[11], -140, -44, "Reference Signal Received Power"), // Reference Signal Received Power
                        rsrq: getValidOrDefault(parts[12], -20, -3, "Invalid Reference Signal Received Quality"), // Reference Signal Received Quality
                        rssi: parts[13], // Received Signal Strength Indicator
                        sinr: parts[14], // Signal to Interface plus Noise Ratio 
                        // computed (according to document) Actual sinr_computed : 1/5.0 *SINR* 10-20 
                        sinr_computed: getValidOrDefault(1 / 5.0 * parseFloat(parts[14]) * 10 - 20, -20, 30, "Invalid (🤔 Computed) Signal to Interface plus Noise Ratio"), // Signal to Interference plus Noise Ratio
                        cqi: getValidOrDefault(parts[15], 1, 30, "Invalid Channel Quality Indicator"), // Channel Quality Indicator
                        tx_power: parts[16], // Transmit Power
                        srxlev: parts[17] // Select reception level value
                    }
                else if (accessTechnology == "NR5G-NSA")
                    return {
                        accessTechnology: accessTechnology,
                        mcc: parts[1],// Mobile Country Code (first part of the PLMN code)
                        mnc: parts[2],// Mobile Network Code  (second part of the PLMN code)
                        pcid: parts[3], // Physical Cell Id
                        rsrp: getValidOrDefault(parts[4], -140, -40, "Invalid Reference Signal Received Power"), // Reference Signal Received Power
                        sinr: getValidOrDefault(parts[5], -20, 30, "Invalid Signal to Interface plus Noise Ratio"), // Signal to Interface plus Noise Ratio
                        rsrq: getValidOrDefault(parts[6], -20, -3, "Invalid Reference Signal Received Quality"), // Reference Signal Received Quality
                        arfcn: parts[7], // The SA-ARFCN of the cell that was scanned
                        band: parts[8], // Frequency band in 5G NR SA network mode
                        nr_dl_bandwidth: parts[9], // 0-14
                        scs: parts[10], // NR sub-carrier space (0: 15kHz, 1: 30kHz, 2: 60kHz, 3: 120kHz, 4: 240kHz)
                    }
                else
                    throw new Error("Unknown access technology. Please check the code and the AT command reference")
            case "LTE":
                return {
                    accessTechnology: parts[0].replace(/"/g, ''),
                    is_tdd: parts[1], // TDD or FDD
                    mcc: parts[2], // Mobile Country Code (first part of the PLMN code)
                    mnc: parts[3], // Mobile Network Code  (second part of the PLMN code)
                    cellId: parts[4],
                    pcid: parts[5], // Physical Cell Id
                    earfcn: parts[6], // UTRA-ARFCN of the cell that was scanned
                    freq_band_ind: parts[7], // E-UTRA frequency band
                    ul_bandwidth: parts[8], // UL bandwidth (0: 1.4MHz, 1: 3MHz, 2: 5MHz, 3: 10MHz, 4: 15MHz, 5: 20MHz)
                    dl_bandwidth: parts[9], // DL bandwidth (0: 1.4MHz, 1: 3MHz, 2: 5MHz, 3: 10MHz, 4: 15MHz, 5: 20MHz)
                    tac: parts[10], // Tracking Area Code
                    rsrp: getValidOrDefault(parts[11], -140, -44, "Invalid Reference Signal Received Power"), // Reference Signal Received Power
                    rsrq: getValidOrDefault(parts[12], -20, -3, "Invalid Reference Signal Received Quality"), // Reference Signal Received Quality
                    rssi: parts[13], // Received Signal Strength Indicator
                    sinr: getValidOrDefault(parts[14], -20, 30, "Invalid Signal to Interface plus Noise Ratio"), // Signal to Interference plus Noise Ratio
                    cqi: parts[15], // Channel Quality Indicator
                    tx_power: parts[16], // Transmit Power
                    srxlev: parts[17] // Select reception level value
                }

            case "WCDMA":
                return {
                    accessTechnology: parts[0].replace(/"/g, ''),
                    mcc: parts[1], // Mobile Country Code (first part of the PLMN code)
                    mnc: parts[2], // Mobile Network Code  (second part of the PLMN code)
                    lac: parts[3], // ?
                    cellId: parts[4], // Cell ID
                    uarfcn: parts[5], // UTRA-ARFCN of the cell that was scanned
                    psc: parts[6], // Physical Cell Id
                    rac: getValidOrDefault(parts[7], 0, 255, "Invalid Routing Area Code"), // Routing Area Code (range 0-255)
                    rscp: parts[8], // Received Signal Code Power level of the cell that was scanned
                    ecio: parts[9], // Carrier to noise ratio in dB = measured Ec/Io value in dB
                    phych: parts[10], // Physical Channel (0:DPCH | 1: FDPCH)
                    sf: getValidOrDefault(parts[11], 0, 8, "Invalid Spreading factor found"), //Spreading factor (0-8) see mappings in doc 
                    slot: parts[12],
                    speech_code: parts[13], // Destination number on which call is to be deflected (IDK what it is)
                    comMode: parts[14], //Compress mode (0 unsupported compression | 1: supported compression)
                }

        }
    }
    catch (e) {
        console.warn(`⚠️ Parsing in mode: ${mode} . This means ${["NR5G-SA", "LTE", "WCDMA"].includes(mode) ? "single cell processing" : "multiple cell processing"}\nIf this is not working, please check the page 95/253 of the manual.`)
        return null
    }
}


/**
 * Use with the `AT+CSQ` command result
 */
function parseSignalStrength(atResult) {

    const resultsAsArrays = atResult.split(",").map(e => e.trim())

    // RSSI - received signal strength indicator (the higher the better)
    const rssi = parseInt(resultsAsArrays[0])
    //Helper function to get the meaning of the RSSI value 
    const getRssiMeaning = (_rssi) => {
        if (rssi == 90)
            return "Not known or not detectable"
        if (rssi == 31)
            return "Excellent (>-51bm)"
        if (rssi > 2)
            return "(-109 dBm to -53 dBm)"
        if (rssi == 1)
            return "(-111dBm)"
        if (rssi == 0)
            return "Horrible (<= -113dBm)"
        else
            return "Unknown"
    }
    const rssiMeaning = getRssiMeaning(rssi);

    // The lower the channel bit error rate value, the better the signal
    const channelBitErrorRate = parseInt(resultsAsArrays[1])
    const getChannelBitErrorRateMeaning = (_cber) => {
        //see 3GPP TS 45.008, section 8.2.4 — a GSM spec
        if (_cber === 99)
            return "Not known or not detectable"
        if (_cber == 0)
            return "Excellent (≤ 0.2%)"
        if (_cber == 1)
            return "Very good (≤0.4%)"
        if (_cber == 2)
            return "Good (≤ 0.8%)"
        if (_cber == 3)
            return "Fair (≤ 1.6%)"
        if (_cber == 4)
            return "Weak (≤ 3.2%)"
        if (_cber == 5)
            return "Poor (≤ 6.4%)"
        if (_cber == 6)
            return "Very poor (≤ 12.8%)"
        if (_cber == 7)
            return "Bad — high error rate (> 12.8%)"
        else
            return "Unknown"
    }
    const channelBitErrorRateMeaning = getChannelBitErrorRateMeaning(channelBitErrorRate);

    return {
        rssi, rssiMeaning,
        channelBitErrorRate, channelBitErrorRateMeaning
    }

}




/**
 * Use with the `AT+QRSRP?` command
 * @param {Array|Object} atResult processes the result of the AT command 
 * @returns {Array} - An array of objects representing the reference signal received power (RSRP) values for different receivers.
 */
function parseQueriedReferenceSignalReceivedPower(atResult) {


    if (!Array.isArray(atResult)) {
        atResult = [atResult]
    }
    return atResult.map(
        (elem) => {
            const parts = elem.split(",")
            // console.log("parts", parts)
            return {
                // Primary Receiver
                prx: getValidOrDefault(parts[0], -140, -44, "Invalid"),
                //Diversity Receiver
                drx: getValidOrDefault(parts[1], -140, -44, "Invalid"),
                // Other two receivers
                rx2: getValidOrDefault(parts[2], -140, -44, "Invalid"),
                rx3: getValidOrDefault(parts[3], -140, -44, "Invalid"),
                // Should say whether LTE or 5G are the radio access technologies used
                radioAccessTech: parts[4]
            }
        }
    )
}


/**
 * Use with the `AT+QRSRQ?` command
 * 
 * */
function parseReferenceSignalReceivedQuality(atResult) {

    if (!Array.isArray(atResult)) {
        atResult = [atResult]
    }
    return atResult.map(
        (elem) => {
            const parts = elem.split(",")
            // console.log("parts", parts)
            return {
                // Primary Receiver
                prx: getValidOrDefault(parts[0], -20, -3, "Invalid"),
                //Diversity Receiver
                drx: getValidOrDefault(parts[1], -20, -3, "Invalid"),
                // Other two receivers
                rx2: getValidOrDefault(parts[2], -20, -3, "Invalid"),
                rx3: getValidOrDefault(parts[3], -20, -3, "Invalid"),
                // Should say whether LTE or 5G are the radio access technologies used
                radioAccessTech: parts[4]
            }
        }
    )
}


/**
 * Use with the `AT+QSINR?` command
 * */
function parseSignalToInterferencePlusNoiseRatio(atResult) {

    if (!Array.isArray(atResult)) {
        atResult = [atResult]
    }
    return atResult.map(
        (elem) => {
            const parts = elem.split(",")
            // console.log("parts", parts)


            radioAccessTech = parts[4]
            // valid range of values depends on radio access technology
            const valuesRange = radioAccessTech === "LTE" ? [-20, 30] : [-23, 40]

            return {
                // Primary Receiver
                prx: getValidOrDefault(parts[0], ...valuesRange, "Invalid"),
                //Diversity Receiver
                drx: getValidOrDefault(parts[1], ...valuesRange, "Invalid"),
                // Other two receivers
                rx2: getValidOrDefault(parts[2], ...valuesRange, "Invalid"),
                rx3: getValidOrDefault(parts[3], ...valuesRange, "Invalid"),
                radioAccessTech: radioAccessTech
            }
        }
    )


}




function validateRangeInt(value, min, max) {
    if (!isNumber(value))
        throw new Error("Value is not a number")
    if (!isNumber(min))
        throw new Error("Min is not a number")
    if (!isNumber(max))
        throw new Error("Max is not a number")


    if (value >= min && value <= max) {
        return true;
    } else {
        return false;
    }
}


function getValidOrDefault(value, min, max, defaultValue = null) {

    // Try to parse the value as an integer automatically
    if (!isNumber(value)) {
        try {
            value = parseInt(value)
        }
        catch (e) {
            console.error("❌ Provided value to getValidOrDefault is not a number")
            return defaultValue
        }
    }
    return validateRangeInt(value, min, max) ? value : defaultValue
}





function isNumber(value) {
    if (typeof value === "number" && !isNaN(value))
        return true
    return false
}




module.exports = {
    parsePDPContextDefinitions,
    parseNetRegitrationState,
    parseServingCell,
    parseActiveConfigurations,
    parseDeviceInfo,
    parseSignalStrength,
    parseQueriedReferenceSignalReceivedPower,
    parseReferenceSignalReceivedQuality,
    parseSignalToInterferencePlusNoiseRatio
}