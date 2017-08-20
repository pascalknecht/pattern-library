'use strict';

const Path = require('path');
const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackLayoutPlugin = require('html-webpack-layout-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ExtractSASS = new ExtractTextPlugin('styles/bundle.css');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
const read = require('read-directory');
const fs = require('fs');
const handlebars = require('handlebars');

const dirnames = {};

const basename = (str, sep) => str.substr(str.lastIndexOf(sep) + 1);

module.exports = (options) => {
    fs.readdirSync('./src/components').forEach(directory => {
        dirnames[directory] = './src/components/' + directory + '/_' + directory + '.html';
    });
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
      },
      {
        test: /\.html$/,
        loader: 'handlebars-loader'
      }]
    }
  };
  for(var propertyName in dirnames) {
    webpackConfig.plugins.push(
        new HtmlWebpackPlugin({
            filename: './components/' + propertyName + '/' + basename(dirnames[propertyName], '/'),
            template: dirnames[propertyName],
            layout: './lib/index.html'
        })
      );
  }

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
        new GenerateJsonPlugin('./components.json', dirnames)
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