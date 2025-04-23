# PI-5G-measurements

<p align="left">
  <img src=".showcase/logo.png" width="300"><br>
</p>

The project consists of a node application that communicates via Serial Port with a cell connectivity module (Quectel RM520N-GL) and allows extracting information regarding the cell signal quality through AT commands.

AT commands are wrapped around a very simple (async / promises interface) and results of the different commands are parsed into a JS object representations that aim to make the returned information more human-readable.

Then, the UI provided allows sending the measured data to a Backend server to link the measurements with a given measured Room.

<p align="left">
  <img src=".showcase/raspi-demo.gif" width="300"/>
</p>

## Getting started

You may want to create an .env file if it does not exist already, set at least the following values depending on your SIM and deploying requirements

```sh
LOCAL_PORT="Your local port" # E.g., 3000 (where the browser page will be available)
SIM_PIN=1234 # The SIM PIN
BACKEND_SERVER="https://{yourServer}.../v1/API" # You may need to change the specific urls if the API changes a lot
FIXED_AUTH_TOKEN="YOUR TOKEN" 
```

- For execution: Run `npm run prod` for running the initialization of the 5G module through a sequence of AT commands and starting the web server locally.

- For development : Run `npm run dev` runs nodemon so that you can preview changes quickly.



## Triggering Measurements 
The application exposes a Web server that exposes REST endpoints to request the execution of various AT command sequences and obtain the results as JSON.

A simple web UI page has been created to interact with the Quectel module as a non-programmer user.

<p align="center">
  <img src=".showcase/ui.png" width="300" >
  <img src=".showcase/ui-v2.png" width="300" ></br>
  <em>The GUI to trigger the measurements from the browser</em>
</p>


## Hardware employed

<p align="center">
  <img src=".showcase/raspberry.jpeg" width="300"><br/>
  <em><b>Raspberry PI 4B</b>  with <b>Waveshare 5-inch Capacitive 5-Points Touch Display</b> </em>
</p>

<p align="center">
  <img src=".showcase/quectel-RM520N-GL.png" width="300">  <br/>
  <em><b>Quectel RM520N-GL</b>  | Firmware Revision: RM520NGLAAR03A03M4G </em>
 </p>

### Reference sheets 🗎

For installation of the components, I roughly relied on the [Waveshare Wiki (RM520N-GL 5G HAT)](https://www.waveshare.com/wiki/RM520N-GL_5G_HAT#5G_Network_Card_Dial-up_Method), although it is not very thorough. The organization of the page is quite horrible.

See [RM520N-GL AT Commans Manual](https://files.waveshare.com/upload/8/8a/Quectel_RG520N%26RG52xF%26RG530F%26RM520N%26RM530N_Series_AT_Commands_Manual_V1.0.0_Preliminary_20220812.pdf)
I added a [copy](./public/assets/docs/Quectel_RG520N&RG52xF&RG530F&RM520N&RM530N_Series_AT_Commands_Manual_V1.0.0.pdf) of the manual to the repo for completeness. No copyright infringement intended though. 




### Limitations | Future work
- Only a subset of the AT commands are supported. Trying to use the `sendATCommandAsync(<command>)` with arbitrary commands may result on wrong parsing or the program hanging infinitely ( this is the case of advanced commands to perform HTTP requests). Problems have been identified for: `AT+QHTTPCFG="contextid",1`  that requires additional arguments passed in several lines.
- No support for parsing neighbouring cells (i.e.  missing parsing for the command `AT+QENG="neighbourcell"`).



### Tech Stack
![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

### Troubleshooting
- The Raspberry PI has been set up to init without graphical interface, run `startx` in the command prompt if you need to use the GUI in the device.


