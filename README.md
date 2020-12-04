# Remote Module Loader ![coverage:100%](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

Loads a CommonJS module from a remote URL for the Browser or Node.js.

![Lunar Module](https://raw.githubusercontent.com/Paciolan/remote-module-loader/master/media/logo-small.png)

## Use Cases

Lazy Load Modules to keep initial load times down and load modules just in time, similar to Webpack's code splitting.

Update Remote Modules independent of the web application. Update a module without redeploying the web application.

## Install

```bash
npm install @paciolan/remote-module-loader
```

## createLoadRemoteModule

The `createLoadRemoteModule` function is used to inject dependencies into a `loadRemoteModule` function.

It is recommended to create a separate file, in this example it is called `src/lib/loadRemoteModule.js`.

### Simple Example

If your module has no external dependencies, this is the easiest method to fetch the remote module.

```javascript
/**
 * src/lib/loadRemoteModule.js
 */

import createLoadRemoteModule from "@paciolan/remote-module-loader";

export default createLoadRemoteModule();
```

### Require Example

You can pass dependencies to the module. All modules loaded with this version of `loadRemoteModule`, will have the dependencies available to `require`.

```javascript
/**
 * src/lib/loadRemoteModule.js
 */

import createLoadRemoteModule, {
  createRequires
} from "@paciolan/remote-module-loader";

const dependencies = {
  react: require("react")
};

const requires = createRequires(dependencies);
export default createLoadRemoteModule({ requires });
```

### Using your own fetcher

The default loader can be overridden if you want to use an alternate method.

This example uses `axios` for the fetcher.

```javascript
/**
 * src/lib/loadRemoteModule.js
 */

import createLoadRemoteModule from "@paciolan/remote-module-loader";
import axios from "axios";

const fetcher = url => axios.get(url).then(request => request.data);

export default createLoadRemoteModule({ fetcher });
```

## Usage

Modules are loaded asynchronously, so use similar techniques to any other async function.

### Promise Style

```javascript
/**
 * src/index.js
 */

import loadRemoteModule from "./lib/loadRemoteModule";

const myModule = loadRemoteModule("http://fake.url/modules/my-module.js");

myModule.then(m => {
  const value = m.default();
  console.log({ value });
});
```

## Async/Await Style

```javascript
/**
 * src/index.js
 */

import loadRemoteModule from "./lib/loadRemoteModule";

const main = async () => {
  const myModule = await loadRemoteModule(
    "http://fake.url/modules/my-module.js"
  );
  const value = myModule.default();
  console.log({ value });
};

main();
```

## Creating a Remote Module

Remote Modules must be in the CommonJS format, using `exports` to export functionality.

This is an example of a simple CommonJS module:

```javascript
function helloWorld() {
  console.log("Hello World!");
}

exports.default = helloWorld;
```

note: overwriting `exports` will cause failures.

```javascript
// ❌ NO!
exports = {
  default: "FAIL!"
};

// ✅ YES!
exports.default = "SUCCESS!";
```

### Webpack

Webpack can be setup to export as CommonJS.

Inside `webpack.config.js`, set the `libraryTarget` to `"commonjs"`.

```javascript
module.exports = {
  output: {
    libraryTarget: "commonjs"
  }
};
```

Dependencies should be excluded from the bundle because they will be provided by the Web Application can be added to webpack's `externals` section.

This will prevent webpack from bundling duplicate 3rd party libraries, decreasing the bundle size.

```javascript
module.exports = {
  output: {
    libraryTarget: "commonjs"
  },
  externals: {
    react: "react"
  }
};
```

## Content Security Policy (CSP)

Sites with a `content_security_policy` header set are likely to not work. CSP puts a restriction on using `new Function`, which `remote-module-loader` relies upon.

[Read more on CSP](https://developer.chrome.com/extensions/contentSecurityPolicy)

## Alternatives

- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation)

## Contributors

Joel Thoms (https://twitter.com/joelnet)

Icon made by [Freepik](https://www.flaticon.com/authors/freepik) from [www.flaticon.com](www.flaticon.com)
