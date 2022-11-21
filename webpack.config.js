const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'production',
    entry: {
        userWalletAuth: './frontend/js/userWalletAuth.js',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'userWalletAuth.js',
        clean: true
    },
    resolve: {
        fallback: {
            "stream": require.resolve("stream-browserify"),
        }
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "frontend/html/index.html", to: "index.html" }
            ]
        })
    ],
    devtool: 'inline-source-map',
    devServer: {
        static: './build',
        hot: true,
        client: {
            overlay: false,
        }
    },
    experiments: {
        asyncWebAssembly: true,
        syncWebAssembly: true,
    },
};