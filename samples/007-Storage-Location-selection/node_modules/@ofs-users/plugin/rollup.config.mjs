/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
export default {
    input: "src/main.ts",
    output: {
        name: "OFS",
        file: "dist/ofs-plugin.es.js",
        format: "es",
    },
    plugins: [
        typescript(),
        terser({
            compress: {
                unsafe: true,
            },
            mangle: {
                properties: {
                    regex: /^_/,
                },
            },
            keep_fnames: true,
            keep_classnames: true,
        }),
    ],
};
