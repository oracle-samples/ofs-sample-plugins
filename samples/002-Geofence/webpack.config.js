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
                test: /\.s[ac]ss$/i,
                use: ["style-loader", "css-loader", "sass-loader"],
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
