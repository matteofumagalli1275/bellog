const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules\/.+\.node$/,
    use: 'node-loader',
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  {
	test: /\.(js|jsx)$/,
	exclude: /(node_modules|bower_components)/,
	use: {
	  loader: "babel-loader",
	  options: {
		presets: ["@babel/preset-env", "@babel/preset-react"],
	  },
	},
  }
];
