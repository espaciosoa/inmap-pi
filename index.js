const express = require("express")
const path = require("path")
const dotenv = require("dotenv")
dotenv.config()
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { parsePDPContextDefinitions, parseNetRegitrationState,
  parseServingCell, parseActiveConfigurations, parseDeviceInfo,
  parseSignalStrength, parseQueriedReferenceSignalReceivedPower,
  parseReferenceSignalReceivedQuality, parseSignalToInterferencePlusNoiseRatio
} = require("./parsing.js")

// Debugging using minicom don't forget
// sudo minicom -D /dev/ttyUSB2
// send ATE1 to enable echo as the first thing
//All Commands Datasheet
//https://files.waveshare.com/upload/8/8a/Quectel_RG520N%26RG52xF%26RG530F%26RM520N%26RM530N_Series_AT_Commands_Manual_V1.0.0_Preliminary_20220812.pdf


const serialPort = new SerialPort({
  path: '/dev/ttyUSB2',
  baudRate: 115200,
});
// Use a readline parser to handle responses from the 5G module
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

const SIM_PIN = process.env.SIM_PIN || "7771" // PIN code for the SIM card


/**
 * Async function that executes Attention (AT) commands in the 5G module connected to the Raspberry Pi
 * @param {string} command an AT command string (e.g., AT+QENG="servingcell"  )
 * @returns on astring containing the full result or 
 */
function sendATCommandAsync(command, logs = true) {

  // Result is wrapped in a promise because the serial port is async
  return new Promise((resolve, reject) => {
    //Set a maximum waiting time for the response
    const MAX_WAIT_T = 7000

    let timeout = setTimeout(() => {
      parser.removeListener('data', onData);
      reject(new Error(`Timeout waiting for response to: ${command}`));
    }, MAX_WAIT_T);


    // This array will hold the response data, all AT commands are expected to end by OK or ERROR
    let responseData = [];


    const onData = (data) => {
      if (logs) console.log('\t\t➡️  Received:', data);
      responseData.push(data)

      if (data === "ERROR" || data.includes("ERROR")) {
        clearTimeout(timeout)
        parser.removeListener('data', onData);
        reject(new Error(`Command failed: ${command} | ${data}`));
      }

      if (/*data.startsWith(matchStartsWith) ||*/ data === 'OK' || data === 'CONNECT') {
        clearTimeout(timeout);
        parser.removeListener('data', onData);

        // If the command returns "Actual data" (not just +COMMAND, OK), then clean up the result. 
        // Otherwise leave OK as indicator of result 
        if (responseData.length > 1) {
          responseData = cleanATResponse(responseData)
          responseData.pop()
        }

        if (responseData.length === 1) {
          responseData = responseData.join("")
        }

        resolve(responseData
          // .join('\n')
        );
      }
    };

    parser.on('data', onData);
    serialPort.write(command + '\r');

  });
}

function rawSend(dat) {
  serialPort.write(dat + '\r');
}


/**
 * Removes the command prefix to obtain the actual body response of an AT command
 * @param {Array<string>} ATResponse as array that has the prefix of the command name (e.g., +QENG) 
 * @returns input array without the prefix
 */
function cleanATResponse(ATResponse) {
  const cleaned = ATResponse.map(part => part.replace(/^\+\w+: ?/, ''));
  return cleaned;
}




// Stores the most recent status of the module
let initStatus = {}

/**
 * Runs the configuration commands to test that the 5G module is actually ready
 */
async function init5GModule(log = false) {

  console.log("📶 Initializing 5G module...")
  // Test connection (single alive)
  try {
    initStatus.unitResponsive = await sendATCommandAsync('AT', 'OK');
  }
  catch (e) {
    console.error("❔ Module not responding. Check the connection. Maybe you set a wrong baud rate or forgot to connect the module to current")
    throw new Error("Module not responding. Check the connection. Maybe you set a wrong baud rate or forgot to connect the module to current")
  }

  // Disable command echo (VERY IMPORTANT)
  initStatus.echoStatus = await sendATCommandAsync("ATE0")

  initStatus.deviceInfo = await sendATCommandAsync('ATI');
  if (log) console.log("Device info:", initStatus.deviceInfo)

  initStatus.imei = await sendATCommandAsync('AT+GSN');
  if (log) console.log("IMEI:", initStatus.imei)

  const displayConfigurations = parseActiveConfigurations(await sendATCommandAsync(`AT&V`))
  if (log) console.log("displayConfigurations", displayConfigurations)
  //Check if usb mode is active to connect the Raspbi using the USB for traffic
  initStatus.usbMode = await sendATCommandAsync('AT+QCFG="usbnet"')
  await wait(500);
  if (initStatus.usbMode !== '"usbnet",1') {
    await wait(500);
    // Set the module to RNDIS so your Raspberry Pi sees it as a USB Ethernet interface (like usb0 or wwan0)
    console.log("⚠️ USB Ethernet is not enabled. Enabling PI USB Ethernet now...")
    initStatus.usbMode = await sendATCommandAsync('AT+QCFG="usbnet",1 ')
  }

  // Ask for status of the SIM CARD
  initStatus.simStatus = await sendATCommandAsync('AT+CPIN?');
  switch (initStatus.simStatus) {
    case "READY":
      console.log("✅ SIM CARD is READY to connect, PIN was already entered")
      break
    case "SIM PIN":
      console.log("⚠️ SIM CARD needs the PIN to work. It will be entered")
      await wait(500)
      try {
        initStatus.simStatus = await sendATCommandAsync(`AT+CPIN="${SIM_PIN}"`);
      }
      catch (e) {
        throw new Error("PIN input failed. Please check it the provided one is right ", e.message)
      }
    case "SIM PUK":
      console.log("⚠️ SIM CARD needs the PUK. It will be entered. \nYou are fucked because you don't know the PUK")
      throw new Error("🟥PUK input is NOT implemented yet. ")

  }

  // Defines a PDP context, which tells the modem how to connect to the mobile data network.
  // AT+CGDCONT=1,"IPV4V6","YOUR_APN"  - APN is 'internet' for O2 carrier (work phone)
  initStatus.PDPContextDefinitions = parsePDPContextDefinitions(await sendATCommandAsync('AT+CGDCONT?'))
  if (log) console.log("PDPContextDefinitions", initStatus.PDPContextDefinitions)
  await wait(500);

  // AT+CGDCONT=1,"IPV4V6","internet"
  // Reboots the module into full functionality mode, applying all settings.
  // full functionality mode (1) , reboot module (1)
  initStatus.fullFunctionality = await sendATCommandAsync('AT+CFUN?', "+CFUN") == 1
  if (!initStatus.fullFunctionality) {
    console.warn("full functionality is not enabled on device")
    console.log("⚠️ Rebooting module to full functionality mode...")
    initStatus.fullFunctionality = await sendATCommandAsync('AT+CFUN=1,1', "+CFUN")
    console.log(`DONE ${initStatus.fullFunctionality}`)
  }
  await wait(500);



  // +CGCONTRDP: <cid>,<bearer_id>,<APN>,<local_addr_and_subnet_mask>,<gw_addr>,
  // <DNS_prim_addr>,<DNS_sec_addr>,<P-CSCF_prim_addr>,<P-CSCF_sec_addr>
  initStatus.confirmDataContext = await sendATCommandAsync("AT+CGCONTRDP")

  initStatus.netRegistrationState = parseNetRegitrationState(await sendATCommandAsync("AT+CEREG?"))

  if (initStatus.netRegistrationState !== "0,1" && initStatus.netRegistrationState !== "0,5") {
    console.log("SIM not registered in network. Trying to register in the network now...")
    initStatus.sos = await sendATCommandAsync('AT+CGDCONT=1,"IPV4V6","telefonica.es"')
  }

  //Check if APN is configured correctly
  initStatus.APNConfig = await sendATCommandAsync('AT+CGDCONT?')



  //OJO THE BEARER CONTEXT IS ACTIVE
  initStatus.bearer = await sendATCommandAsync("AT+QIACT?");
  if (log) console.log("Bearer info:", initStatus.bearer);

  // await sendATCommandAsync('AT+COPS=0'); // Automatic operator selection
  const unsolicitedReg = await sendATCommandAsync('AT+CEREG=2'); // Enable unsolicited registration + info
  if (log) console.log("unsolicited Registration", unsolicitedReg)
  // await wait(3000);

  initStatus.netRegistrationState = parseNetRegitrationState(await sendATCommandAsync("AT+CEREG?"))
  initStatus.servingCell = await sendATCommandAsync('AT+QENG="servingcell"')



  console.log("▶️ Init status", JSON.stringify(initStatus, null, 4))
  // console.log(await generalCommands())
  // console.log(await signalMeasurementCommands())


}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}




async function generalCommands() {

  //Identification of the device (mix of info - Manufacturer model firmware)
  const deviceInfo = parseDeviceInfo(await sendATCommandAsync(`ATI`)) // Returns something like Quectel (RM520-GL) ...

  //Get IMEI
  const imei = await sendATCommandAsync(`AT+GSN`)

  //Display configurations
  const activeConfiguration = parseActiveConfigurations(await sendATCommandAsync(`AT&V`))

  //Echo Makes sure the responses include also the command that was sent
  // `AT1`

  const flatConfiguration = activeConfiguration.map(configuration => { return { [`${configuration.key}`]: configuration.value } })

  return {
    deviceInfo, imei,
    flatConfiguration
  }
}



/**
 * IGNORE ME FOR NOW
 * 
 */
async function simRelatedCommands() {

  //CHECK ACTIVE SIM SLOT
  `AT+QUIMSLOT?` // Returns probably 1

  await sendATCommandAsync('AT+COPS?');
  //Check PIN status
  `AT+CPIN=?`

    //Enter the pin to make the SIM work
    `AT+CPIN="7771"` // PIN code for the SIM card
    //I got this response
    // +CPIN: READY                                                                                                                                               
    // +QUSIM: 1                                                                                                                                                 
    // +QIND: SMS DONE                                                                                                                                         
    // +QIND: PB DONE 

    // Query initialization status of the SIM card 
    `AT+QINISAT`// Expected 7 as return (means the sim is ready, sms is init, phonebook init also)
}


async function testConnectionCommands() {

  initStatus.ipAssigned = await sendATCommandAsync('AT+CGPADDR=1')

  initStatus.ping = await sendATCommandAsync('AT+QPING=1,"8.8.8.8"')
  console.log("PING", initStatus.ping)
  initStatus.dnsCheck = await sendATCommandAsync('AT+QIDNSGIP=1,"google.com"')

}






async function signalMeasurementCommands(logs = true) {

  const signalStrength = parseSignalStrength(await sendATCommandAsync(`AT+CSQ`)) // Signal Quality Report - Returns signal stregnth
  // Should return something like +CSQ: 24,99
  if (logs) console.log("1) Signal Strength:", signalStrength)

  const qrsrp = parseQueriedReferenceSignalReceivedPower(await sendATCommandAsync(`AT+QRSRP?`)) // Queried Reference Signal Received Power-
  // Should return values in the range [-140, -44] dBm So only those are valid
  //Example result : +QRSRP: -111,-90,-32768,-32768,LTE   (the last two are invalid)
  if (logs) console.log("2) QRSRP", qrsrp)

  const qrsrq = parseReferenceSignalReceivedQuality(await sendATCommandAsync(`AT+QRSRQ?`)) // Reference Signal Received Quality
  //Returns values in the range [-20, -3] dB
  //Should return something like: +QRSRQ: -13,-9,-32768,-32768,LTE 
  if (logs) console.log("3) QRSRQ", qrsrq)

  const sinr = parseSignalToInterferencePlusNoiseRatio(await sendATCommandAsync(`AT+QSINR?`))// Signal-to-Interference plus Noise Ratio
  // should hold values in around [-20 to 40 dB] (see manual, depends on LTE or 5G)
  // +QSINR: 0,4,-32768,-32768,LTE                                                   
  // +QSINR: 12,7,-32768,-20,NR5G
  if (logs) console.log("3) sinr", sinr)


  //  await sendATCommandAsync(`AT+QNWINFO?`) //Queries network information (returns info such as access technologies, operator and band)
  //           Technology,Operator(numeric), Band                      
  //+QNWINFO: "FDD LTE","21407","LTE BAND 3",1301 

  const servingCell = parseServingCell(await sendATCommandAsync(`AT+QENG="servingcell"`)) // Returns info about the serving cell (band, frequency, PCI, EARFCN, etc)
  // Example result (can be single line or multiline)
  //"servingcell","NOCONN","LTE","FDD",214,07,290580A,465,1301,3,5,5,40D8,-98,-18,-57,11,0,-,25
  if (logs) console.log("servingCell", servingCell)

  // @todo
  // const neighborCell = await sendATCommandAsync(`AT+QENG="neighbourcell"`) // Returns info about the neighbor cells (band, frequency, PCI, EARFCN, etc)


  return {
    signalStrength,
    qrsrp,
    qrsrq,
    sinr,
    servingCell
  }

}



/**
 * 💀 UNSUPPORTED DUE TO HOW I HANDLED PARSING FOR THE USE CASE 💀
 * @deprecated
 */
async function makeHttpRequest() {
  // try {
  //   console.log(await sendATCommandAsync('AT+QHTTPCFG="contextid",1'))
  //   console.log(await sendATCommandAsync('AT+QHTTPURL=29,80')) +
  //   rawSend('https://google.com')
  //   console.log(await sendATCommandAsync('AT+QHTTPGET=80'))
  //   console.log("CONTENT HTTP", await sendATCommandAsync('AT+QHTTPREAD=80'))
  // }
  // catch (e) {
  //   console.log("ERROR ATTEMPTING A REQUEST")
  // } finally {
  //   await sendATCommandAsync('AT+QIDEACT=1')
  // }
  throw new Error("Not supported method.")
}


/**
 * 🟥 Not supported yet !
 * The Quectel module has a GPS module but the current version of the firmware does not seem to support it. 
 * I should update the firmware to the latest version and try again IF THE PROJECT NEEDS GPS
 */
async function gpsCommands() {
  throw new Error("Not supported method. I believe there is an incompatibility with the GPS module")
  // Check that GPS is supported
  await sendATCommandAsync(`AT+GPSCFG="gnssconfig"`) // Should return something like: +QGPSCFG: "gnssconfig",1 
}


// ---------------------------------------------
// Web server / Interface side of things
// ---------------------------------------------
const PORT = process.env.LOCAL_PORT || 3000
const BACKEND_SERVER = process.env.BACKEND_SERVER
if (BACKEND_SERVER == null) throw new Error("BACKEND_SERVER environment variable not provided")



const app = express()
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Just returns the GUI view for triggering measurements
app.get("/", (req, res) => {
  return res.sendFile("index.html")
})



async function tryMeasure() {

  try {
    console.log("📶 Triggering measurements...")
    const allMeasurements = await signalMeasurementCommands()
    console.log(allMeasurements)
    return {
      measurementOwner: "ESOA",
      measurementDevice: "RaspberryPi4B",
      timestamp: new Date().toISOString(),
      allMeasurements
    }
  }
  catch (e) {
    throw new Error("Error executing measurements", e.error)
  }

}




// async function handleMeasureRequest(req, res) {
//   try {
//     console.log("📶 Triggering measurements...")
//     const allMeasurements = await signalMeasurementCommands()
//     console.log(allMeasurements)
//     return res.json({
//       success: true,
//       data: {
//         measurementOwner: "ESOA",
//         measurementDevice: "RaspberryPi4B",
//         timestamp: new Date().toISOString(),
//         allMeasurements
//       }
//     });
//   }
//   catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: `Error triggering AT commands ${e.message}`
//     });
//   }
// }


app.get('/measure', async (_, res) => {

  console.log("/measure called")

  try {
    return res.json({
      success: true,
      data: await tryMeasure()
    });

  }
  catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message
    });
  }


})



app.post("/measureAndSend", async (req, res) => {


  console.log("/measureAndSend called")

  console.log(req.body)
  //extract name from request
  const roomName = req.body.name


  if (!roomName)
    return res.status(400).json({
      success: false,
      message: "Bad request, missing name"
    })

  try {
    const remRequest = new Request(`${BACKEND_SERVER}/Rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authorization": `${process.env.FIXED_AUTH_TOKEN}`
      },
      body: JSON.stringify({ name: roomName }),
    });

    console.log("Fetching...")
    // Do request
    const remResponse = await fetch(remRequest);

    if (!remResponse.ok) {
      console.log("AAAAAAAAAAAAAAAA")
      console.log("remResponse", remResponse)
      return res.status(200).json({
        success: false,
        message: `Backend responded with error code ${remResponse.status}`
      })
    }

    // console.log(remResponse)

    const resBody = await remResponse.json()
    console.log("RESPONSE 1:", resBody)



    // If it gets here I already should have an id for the room

    // return res.status(200).json(
    //   {
    //     success: true,
    //     data: resBody
    //   }
    // )

    const roomId = resBody._id
    //DO MEasurements and create a measurement object to send


    console.log("Making request 2")
    const measurements = await tryMeasure()

    //This is what I will send to the backend so that later I can link the data 
    const raspMeasurementBody = {
      ...measurements,
      roomId: roomId,
      position: { x: 0, y: 0, z: 0 }
    }


    const postMeasurementsRequest = new Request(`${BACKEND_SERVER}/RoomMeasurements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authorization": `${process.env.FIXED_AUTH_TOKEN}`
      },
      body: JSON.stringify(raspMeasurementBody),
    });

    console.log("Fetch 2...")
    const measurementsSavedResponse = await fetch(postMeasurementsRequest)

    if (!measurementsSavedResponse.ok) {
      console.log("Problem with saving measurements fetch")
      console.log("measurementsSavedResponse", measurementsSavedResponse)
      return res.status(200).json({
        success: false,
        message: `Backend (measurements) responded with error code ${remResponse.status}`
      })
    }


    const savedRespData = await measurementsSavedResponse.json()




    return res.status(200).json({
      success: true,
      data: savedRespData
    })

  }
  catch (e) {
    return res.status(200).json({
      success: false,
      message: `Request to measurements backend failed ${e}`
    })
  }

})



app.get('/modem-status', async (req, res) => {
  const modemData = initStatus
  console.log(modemData)
  res.json(modemData);  // Send the init status data
});




// MAIN FUNCTION
(async () => {
  try {
    await init5GModule()
  } catch (e) {
    console.error("🟥 Unrecoverable error. 5G Module not initialized. Exiting...", e.message)
    return process.exit(0)
  }

  app.listen(PORT, () => {
    console.log(`🌐 Server running on http://localhost:${PORT}\n`);
  });

})();



