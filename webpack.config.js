const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devServer: {
    port: 3789,
    allowedHosts: ['all', '.alibaba-inc.com']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: 'body'
    })
  ]
};
