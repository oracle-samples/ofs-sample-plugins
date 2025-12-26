/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

const path = require("path");
const webpack = require("webpack");

module.exports = {
    entry: "./assets/js/main.ts",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.s[ac]ss$/i,
                use: ["style-loader", "css-loader", "sass-loader"],
            },
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"],
        }),
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        fallback: {
            fs: false,
        },
    },
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
    },
};
