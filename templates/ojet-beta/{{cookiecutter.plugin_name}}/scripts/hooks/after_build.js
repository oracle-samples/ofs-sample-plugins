/**
  Copyright (c) 2015, 2023, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/

/**
  Copyright (c) 2015, 2023, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/

"use strict";
const fs = require("fs");
const archiver = require("archiver");

module.exports = function (configObj) {
    return new Promise((resolve, reject) => {
        console.log("Running after_build hook.");
        //change the extension of the my-archive.xxx file from .war to .zip as needed
        const output = fs.createWriteStream("plugin.zip");
        //leave unchanged, compression is the same for WAR or Zip file
        const archive = archiver("zip");

        output.on("close", () => {
            console.log("Files were successfully archived.");
            resolve();
        });

        archive.on("warning", (error) => {
            console.warn(error);
        });

        archive.on("error", (error) => {
            reject(error);
        });

        archive.pipe(output);
        // Read the list of files from the file
        const descriptor = JSON.parse(
            fs.readFileSync("plugin_descriptor.json", "utf8")
        );
        const files = descriptor.src_files;

        // Add each file to the archive
        files.forEach((file) => {
            if (fs.existsSync(file)) {
                const relativePath = file.replace(
                    `${configObj.paths.staging.stagingPath}/`,
                    ""
                );
                archive.file(file, { name: relativePath });
            } else {
                console.warn(`WARNING: File ${file} does not exist.`);
            }
        });

        archive.finalize();

        resolve(configObj);
    });
};
