/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

var config = {
    entry: "./assets/js/main.ts",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ["ts-loader"],
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: "process/browser",
            Buffer: ["buffer", "Buffer"],
        }),
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        fallback: {
            buffer: require.resolve("buffer"),
            fs: false
        },
    },
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    parse: {},
                    compress: {},
                    mangle: {
                        properties: {
                            regex: /^_/,
                        },
                    },
                },
            }),
        ],
    },
};

module.exports = (env, argv) => {
    if (argv.mode === "development") {
        config.optimization.minimize = false;
        config.devtool = "inline-source-map";
    }

    if (argv.mode === "production") {
        config.optimization.minimize = true;
        config.devtool = undefined;
    }

    return config;
};
