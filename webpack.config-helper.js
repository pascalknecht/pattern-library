'use strict';

const Path = require('path');
const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackLayoutPlugin = require('html-webpack-layout-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ExtractSASS = new ExtractTextPlugin('styles/bundle.css');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const read = require('read-directory');
const fs = require('fs');
const handlebars = require('handlebars');

const dirnames = {};

const componentPath = Path.resolve('./src/components');
const basename = (str, sep) => str.substr(str.lastIndexOf(sep) + 1);

module.exports = (options) => {
    fs.readdirSync(componentPath).forEach(directory => {
        dirnames[directory] = componentPath + '/' + directory + '/_' + directory + '.html';
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
        filename: './src/index.html',
        template: './lib/template.ejs',
        data: dirnames
      }),
      new CopyWebpackPlugin([
        { from: 'src/images', to: 'images/' }
      ]),
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
  /*
  for(var propertyName in dirnames) {
    webpackConfig.plugins.push(
        new HtmlWebpackPlugin({
            filename: './components/' + propertyName + '/' + basename(dirnames[propertyName], '/'),
            template: './lib/template.ejs',
            data: dirnames
        })
      );
  }*/

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