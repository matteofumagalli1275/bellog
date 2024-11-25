const path = require("path");
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: "production", // "development" | "production
    entry: {
        main: "./src/index.tsx",  // Your React entry
        runtime: "./src/runtime.tsx" // Your TypeScript-only entry
    },
    devtool: false,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", {
                    loader: "css-loader"
                }]
            }
        ]
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.css', '.scss'],
    },
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/"
    },
    plugins: [
        new CopyPlugin({
            patterns:
                [
                    {
                        from: 'src/index.html', to: './'
                    },
                    {
                        from: 'src/runtime.html', to: './'
                    },
                    {
                        from: 'src/runtime.css', to: './'
                    },
                    {
                        from: 'src/runtime-shell.css', to: './'
                    },
                    {
                        from: 'src/logo.png', to: './'
                    },
                    {
                        from: 'src/favicon.png', to: './'
                    },
                    {
                        from: 'src/webfonts/', to: './webfonts'
                    },
                    {
                        from: 'src/lib/', to: './'
                    },
                    {
                        from: 'src/res/', to: './res'
                    },
                ]
        })
    ]
}