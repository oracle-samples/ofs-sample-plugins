import { OFSPlugin, OFSMessage, OFSOpenMessage, OFSCloseMessage } from "@ofs-users/plugin";
import { JSONTree } from "./utils/jsonview";
import { haversine } from "./utils/haversine";

class OFSCustomActivity {
    // We create a custom class to keep track of which properties are we using
    acoord_x!: number;
    acoord_y!: number;
    XA_GEOFENCE_LAST_STAGE!: String;
    aid!: number;
    XA_GEOFENCE_RESULT!: number;
    acoord_status!: String;
}

class OFSCustomOpenMessage extends OFSOpenMessage {
    activity!: OFSCustomActivity
    securedData!: {
        radius: number
    }
}

class OFSCustomCloseMessage {
    activity!: {
        aid: number;
        XA_GEOFENCE_LAST_STAGE: String;
        XA_GEOFENCE_RESULT: number;
    };
}

const geoLocationOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
};

export class CustomPlugin extends OFSPlugin {
    open(data: OFSCustomOpenMessage) {
        const tree = new JSONTree(JSON.stringify(data));
        const input_data = document.getElementById("input_data");
        if (!!input_data) {
            tree.render(input_data);
        }

        // Build base response
        let result = new OFSCustomCloseMessage();
        result.activity = new OFSCustomActivity();
        result.activity.aid = data.activity?.aid;
        result.activity.XA_GEOFENCE_LAST_STAGE = "START";
        result.activity.XA_GEOFENCE_RESULT = 101;

        // Set close button handler
        const submit_button = document.getElementById("submit_button")
        if (!!submit_button) {
            submit_button.onclick = (() => {
                console.log("Click!", result)
                this.close(result)
            });
        }



        const content = document.getElementById("content");
        if (!!content) {
            content.innerHTML = `Activity Location: ${data.activity.acoord_y},${data.activity.acoord_x}<BR>`;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        let distance = haversine(position.coords.latitude, position.coords.longitude, data.activity.acoord_y, data.activity.acoord_x);
                        content.innerHTML = content.innerHTML + `Geolocation activated: <LI>Tech Position: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)} <LI>Distance: ${distance.toFixed(3)} meters`
                        if (distance < data.securedData.radius) {
                            content.innerHTML = `${content.innerHTML}<BR> OK. Inside radius (${data.securedData.radius})`;
                            result.activity.XA_GEOFENCE_RESULT = 1;
                        } else {
                            content.innerHTML = `${content.innerHTML}<BR> KO. Outside radius (${data.securedData.radius})`;
                        }
                    },
                    (error) => {
                        content.innerHTML = `Error in geolocation: ${error.message}`;
                        result.activity.XA_GEOFENCE_RESULT = 101;
                    },
                    geoLocationOptions
                );


            } else {
                content.innerHTML = `Geolocation deactivated`;
            }
        }
    }
}
