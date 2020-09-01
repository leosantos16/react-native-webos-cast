import { DeviceEventEmitter } from 'react-native';
import { Client } from 'react-native-ssdp';
import appInfo from '../assets/appinfo.json';

const SSDPClient = new Client();

const detectedDevices = [];

var ws = null;

let identifier = 1;

addDevice = (ip) => {
    fetch(ip)
    .then((response) => response.text())
    .then((application) => {
        let manufacturer = application.split("<manufacturer>");
        let closeManufacturer = manufacturer[1].split("</manufacturer>");
        if(closeManufacturer[0].includes("LG")) {
            let websockport = ip.slice(0, -1);
            let port = websockport.lastIndexOf(":");
            port = websockport.substr(port);
            let websocketip = websockport.replace(port, ":3000");
            websocketip = websocketip.split("//")[1];
            if(!detectedDevices.includes(websocketip)) {
                detectedDevices.push(websocketip);
                DeviceEventEmitter.emit('webOSDevice', websocketip);
            }
        }
    });
}

receiveMessage = (message) => {
    let data = JSON.parse(message.data);
    if(data.type == "registered") {
        DeviceEventEmitter.emit('webOSEvent', message);
    }
}

receiveOpen = () => {
    const app = JSON.stringify(appInfo);
    ws.send(app);
}

SSDPClient.on('response', (headers) => addDevice(headers.LOCATION));

export default {

    startSearch() {
        SSDPClient.search('urn:dial-multiscreen-org:service:dial:1');
        return true;
    },

    stopSearch() {
        SSDPClient.stop();
        return true;
    },

    getDevices() {
        return detectedDevices;
    },

    startSock(ip) {
        ws = new WebSocket('ws://'+ip, "", {
            headers: {
                origin: null
            }
        });
        ws.onopen = receiveOpen;
        ws.onmessage = receiveMessage;
        ws.onerror = (error) => console.log(error.reason);
        ws.onclose = (error) => console.log(error.reason);
    },

    stopSock() {
        ws.close();
    },

    castContent(appName, payload) {
        console.log(JSON.stringify({
            id: identifier,
            uri: 'ssap://system.launcher/launch',
            type: 'request',
            payload: {
                id: appName,
                "params": payload
            }
        }));
        ws.send(JSON.stringify({
            id: identifier,
            uri: 'ssap://system.launcher/launch',
            type: 'request',
            payload: {
                id: appName,
                "params": payload
            }
        }));
        identifier += 1;
    }

}