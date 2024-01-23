## A simple example

A plugin usually consists in a HTML page (`index.html`) and a simple code (`plugin.js`). 

**index.html**
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
        <title>plugin-template</title>
    </head>
    <body>
        <div id='output_data'>
        <hr>
        <div id="submit_button" type="submit">OK</button></div>
        <script src="./main.js" type="module"></script>
    </body>

**plugin.js**

    import { OFSPlugin} from "@ofs-users/plugin";  ### Provided as example. Different frameworks will handle imports in a different way

    class CustomPlugin extends OFSPlugin {
     
        open(data) {
            document.getElementById("output_data").innerHTML = `<p> Hello World! Activity is ${data.activity.aid}</p>`
            var submit_button = document.getElementById("submit_button");
            if (!!submit_button) {
                submit_button.onclick = function (event) {
                    var feedback = {
                        aid: data.activity.aid,
                        // BEGIN: ADD EXTRA PARAMETERS
                        // END: ADD EXTRA PARAMETERS
                    };
                    plugin.close({ activity: feedback});
                };
            }
        }
    }

    window.onload = function () {
        window.ofs = new CustomPlugin("HelloWorld");
    };