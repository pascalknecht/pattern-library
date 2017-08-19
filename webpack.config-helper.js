'use strict';

const Path = require('path');
const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackLayoutPlugin = require('html-webpack-layout-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ExtractSASS = new ExtractTextPlugin('styles/bundle.css');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
const read = require('read-directory');
const dirScan = require('webpack-directory-scan');

const dirnames = [
    './src/components/buttons/_buttons.html'
];

module.exports = (options) => {
  let webpackConfig = {
    devtool: options.devtool,
    entry: [
      `webpack-dev-server/client?http://localhost:${options.port}`,
      'webpack/hot/dev-server',
      './src/scripts/index'
    ],
    output: {
      path: __dirname + "/dist",
      filename: 'bundle.js',
    },
    plugins: [
      new Webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(options.isProduction ? 'production' : 'development')
        }
      }),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        layout: './lib/index.html'
      }),
      new HtmlWebpackLayoutPlugin({
          layout: './lib/index.html'
      }),
      new GenerateJsonPlugin('components.json', {
          foo: 'bar'
      })
    ],
    module: {
      loaders: [{
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }]
    }
  };

  dirnames.forEach((ele) => {
      console.log(ele);
      webpackConfig.plugins.push(
        new HtmlWebpackPlugin({
            filename: './components/_buttons.html',
            template: ele,
            layout: './lib/index.html'
        })
      );
  });

  if (options.isProduction) {
    webpackConfig.entry = ['./src/scripts/index'];

    webpackConfig.plugins.push(
      new Webpack.optimize.OccurenceOrderPlugin(),
      new Webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        }
      }),
      ExtractSASS
    );

    webpackConfig.module.loaders.push({
      test: /\.scss$/i,
      loader: ExtractSASS.extract(['css', 'sass'])
    });

  } else {
    webpackConfig.plugins.push(
      new Webpack.HotModuleReplacementPlugin()
    );

    webpackConfig.plugins.push(
        new GenerateJsonPlugin('./components.json', {
            foo: 'bar'
        })
    );

    webpackConfig.module.loaders.push({
      test: /\.scss$/i,
      loaders: ['style', 'css', 'sass']
    }, {
      test: /\.js$/,
      loader: 'eslint',
      exclude: /node_modules/
    });

    webpackConfig.devServer = {
      contentBase: './dist',
      hot: true,
      port: options.port,
      inline: true,
      progress: true
    };
  }

  return webpackConfig;

}