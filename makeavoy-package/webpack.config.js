const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const SitemapPlugin = require("sitemap-webpack-plugin").default;

// const paths = [
//   {
//     path: "/svg/",
//     lastmod: "2019-01-01",
//     priority: 0.8,
//     changefreq: "yearly",
//   },
//   {
//     path: "/desk/",
//     lastmod: "2018-02-05",
//     priority: 0.5,
//     changefreq: "yearly",
//   },
//   {
//     path: "/fruit/",
//     lastmod: "2018-02-05",
//     priority: 0.5,
//     changefreq: "never",
//   },
//   {
//     path: "/stomp/",
//     lastmod: "2014-01-01",
//     priority: 0.5,
//     changefreq: "never",
//   },
// ];

module.exports = (env, argv) => {
  let devMode = argv.mode !== "production";
  console.log("dev mode is " + devMode + " " + argv.mode);

  return {
    mode: "production", //'production',
    entry: "./src/Main.ts",
    plugins: [
      new CleanWebpackPlugin({
        dry: false,
        cleanOnceBeforeBuildPatterns: [
          "**/*",
          "!styles",
          "!styles/*",
          "!assets",
          "!assets/*",
          "!assets/room/*",
          "!partials",
          "!partials/*",
          "!robots.txt",
          "!sitemap.xml",
        ],
        verbose: true,
      }),
      new HtmlWebpackPlugin({ template: "./src/index.html" }),
      new HtmlWebpackPlugin({
        filename: "partials/about.html",
        template: "./src/about.html",
      }),
      // new SitemapPlugin({
      //   base: "https://MakeAvoy.com",
      //   paths,
      //   options: { lastmod: true },
      // }),
    ],
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      // Add support for TypeScripts fully qualified ESM imports.
      extensionAlias: {
        ".js": [".js", ".ts"],
        ".cjs": [".cjs", ".cts"],
        ".mjs": [".mjs", ".mts"],
      },
      modules: ["node_modules"],
    },
    module: {
      rules: [
        // {
        //   test: /\.css$/,
        //   use: ["style-loader", "css-loader"],
        // },
        // scss
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            // Creates `style` nodes from JS strings
            "style-loader",
            "css-loader",
            "sass-loader",
          ],
        },
        {
          test: /\.ts?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.(jpe?g|gif|png|svg|woff|ttf|wav|mp3)$/,
          type: "asset/resource",
        },
      ],
    },
    output: {
      filename: "[name].[contenthash].js",
      path: path.resolve(__dirname, "../makeavoy-dist/"), // string
      // the target directory for all output files
    },
    optimization: {
      runtimeChunk: "single",
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          lib: {
            test: path.resolve("src/lib"),
            name: "libs",
            chunks: "all",
          },

          apps: {
            test: /apps\/[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]App[\\/](.*?)([\\/]|$)/
              )[1];
              return packageName;
            },
          },
        },
      },
    },
    devtool: devMode ? "eval-source-map" : false,
    devServer: {
      static: {
        directory: path.join(__dirname, "../makeavoy-dist/"),
      },
      compress: true,
      port: 9000,
      proxy: {
        "/assets": {
          target: "http://192.168.1.45:9001",
          secure: false,
          changeOrigin: true,
          pathRewrite: { "^/assets": "" },
        },
      },
    },
    // externals: {
    //   silt_lua: require("silt_lua"),
    // },
  };
};
