const path = require('path')
module.exports = {
  entry: ['@babel/polyfill', path.join(__dirname, 'src/js', 'App.js')],
  devServer: {
    contentBase: path.join(__dirname, 'src'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'build.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        include: [/src/, /node_modules/]
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['@babel/env', '@babel/react']
        }
      }, {
        test: /\.json$/,
        loader: 'json-loader',
        include: '/build/contracts/'
      }
    ]
  }
}