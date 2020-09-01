import { DeviceEventEmitter } from 'react-native';
import { Client } from 'react-native-ssdp';
import appInfo from '../assets/appinfo.json';

const SSDPClient = new Client();

const detectedDevices = [];

var ws = null;

let identifier = 1;

addDevice = (ip) => {
    let websockport = ip.slice(0, -1);
    let port = websockport.lastIndexOf(":");
    port = websockport.substr(port);
    let websocketip = websockport.replace(port, ":3000");
    websocketip = websocketip.split("//")[1];
    detectedDevices.push(websocketip);
    DeviceEventEmitter.emit('webOSDevice', websocketip);
    return websocketip;
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
        ws = new WebSocket('ws://'+ip);
        ws.onopen(receiveOpen);
        ws.onmessage(receiveMessage);
        ws.onerror(console.log);
        ws.onclose(console.log);
    },

    stopSock() {
        ws.close();
    },

    castContent(appName, payload) {
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