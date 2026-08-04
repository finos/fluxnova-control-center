import { WebpackAssetsManifest } from 'webpack-assets-manifest';
import webpack from 'webpack';
import { remove } from 'lodash-es';
import CompressionPlugin from 'compression-webpack-plugin';
import { merge } from 'webpack-merge';

class RemoveHashPlugin {
  apply() {}
}

module.exports = (config: any, options: any) => {
  //remove RemoveHashPlugin to allow hashing lazy css
  //https://github.com/angular/angular-cli/blob/master/packages/angular_devkit/build_angular/src/webpack/plugins/remove-hash-plugin.ts
  remove(config.plugins, (p) => p.constructor.name === 'RemoveHashPlugin');

  const customConfig = {
    module: {
      rules: [
        {
          test: /\.svg$/,
          use: ['file-loader'],
        },
      ],
    },
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment/,
      }),
      new WebpackAssetsManifest(),
    ],
  };

  if (config.mode === 'production') {
    config.plugins.push(
      new CompressionPlugin({
        filename: '[path][base].br',
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg|json|bpmn|dmn)$/,
        threshold: 10240,
        minRatio: 0.8,
        deleteOriginalAssets: false,
      }),
    );
  }

  return merge(config, customConfig);
};
