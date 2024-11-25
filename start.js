const Webpack = require("webpack");
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('./webpack.config.js')
const path = require("path");

const proxy = {
	setupMiddlewares: (middlewares, devServer) => {
		if (!devServer) return middlewares;

		devServer.app.get("/runtime", (req, res) => {
			res.sendFile(path.join(__dirname, "./dist/runtime.html"));
		})

		return middlewares;
	}
};

// Add local mode flag accessible from frontend code as constant
// This can be used to toggle functionalities that require server running on localhost like websockify
webpackConfig.plugins.push(new Webpack.DefinePlugin({
    LOCAL_MODE: JSON.stringify(true)
}))

webpackConfig.mode = "development"

const compiler = Webpack(webpackConfig);
const devServerOptions = { ...{ ...webpackConfig.devServer, ...proxy }, open: true };
const server = new WebpackDevServer(devServerOptions, compiler);

const runServer = async () => {
    console.log('Starting server...');
    await server.start();
};

runServer();
