const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const VendorChunkPlugin = require("webpack-vendor-chunk-plugin");
const SplitByPathPlugin = require("webpack-split-by-path");


const TARGET = process.env.npm_lifecycle_event || "start";
process.env.BABEL_ENV = TARGET;


const PATHS = {
    app: path.join(__dirname, "src", "js"),
    build: path.join(__dirname, "lib", "js")
};

const common = {
    entry: {
        index: ["babel-polyfill", PATHS.app]
    },
    resolve: {
        extensions: ["", ".js"]
    },
    output: {
        path: PATHS.build,
        filename: "[name].js",
        publicPath: "/js/"
    },
    externals: {
        "phaser": "Phaser"
    },
    module: {
        preLoaders: [],

        loaders: [
            {
                test: /.jsx?$/,
                include: PATHS.app,
                loaders: ["babel-loader?cacheDirectory"]
            }
        ],

        postLoaders: []
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(true),
        new SplitByPathPlugin([{
            name: "vendor",
            path: path.join(__dirname, "node_modules")
        }]),
        new VendorChunkPlugin("vendor")
    ]
};

const devServer = {
    contentBase: PATHS.build,

    // Enable history API fallback so HTML5 History API based
    // routing works. This is a good default that will come
    // in handy in more complicated setups.
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true,

    // Display only errors to reduce the amount of output.
    stats: "errors-only",
    colors: true,

    // Parse host and port from env so this is easy to customize.
    host: process.env.HOST,
    port: process.env.PORT
};

// Default configuration
if (TARGET === "start" || !TARGET) {
    // common.entry["index"].unshift(`webpack-hot-middleware/client`);

    module.exports = merge(common, {
        devtool: "eval-source-map",
        devServer: devServer,
        plugins: [
            // new webpack.HotModuleReplacementPlugin(),
            new webpack.NoErrorsPlugin()
        ]
    });
}

if (TARGET === "build") {
    console.info("Webpack Export: BUILD MODE!");
    module.exports = merge(common, {
        production: true,
        debug: false,

        plugins: [
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false
                }
            })
        ]
    });
}
