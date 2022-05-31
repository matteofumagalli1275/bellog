const path = require("path");
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: "./src/index.tsx",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, "dist/"),
        filename: "bundle.js"
    },
    plugins: [
        new CopyPlugin( { patterns:
            [
                {
                    from: 'src/index.html', to: './'
                }
            ]
        })
    ]
};