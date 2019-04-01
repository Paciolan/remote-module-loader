# Remote Module Loader [![pipeline status](https://gitlabdev.paciolan.info/development/library/javascript/remote-module-loader/badges/master/pipeline.svg)](https://gitlabdev.paciolan.info/development/library/javascript/remote-module-loader/commits/master) [![coverage report](https://gitlabdev.paciolan.info/development/library/javascript/remote-module-loader/badges/master/coverage.svg)](https://gitlabdev.paciolan.info/development/library/javascript/remote-module-loader/commits/master)

Loads a module from a remote url.

# Use Cases

Lazy Load Modules to keep initial load times down and load modules just in time.

Update Remote Modules independent of the web application. Update a module without redeploying the web application.

# Install

```bash
npm install @paciolan/remote-module-loader
```

# createLoadRemoteModule

## Simple Example

If your module has no external dependencies, this is the easiest method to fetch the remote module.

```javascript
/**
 * src/lib/loadRemoteModule.js
 */

import { createLoadRemoteModule } from "@paciolan/remote-module-loader";

export default createLoadRemoteModule();
```

## Require Example

You can pass dependencies to the module.

```javascript
/**
 * src/lib/loadRemoteModule.js
 */

import { createLoadRemoteModule } from "@paciolan/remote-module-loader";

// dependencies for the loaded module.
const dependencies = {
  react: require("react")
};

// requires method exposes dependencies to the loaded module.
const requires = name => dependencies[name];

export default createLoadRemoteModule({ requires });
```

## Using your own fetcher

By default `loadRemoteModule` will use the `XMLHttpRequest` object avaiable in the browser. This can be overridden if you want to use an alternate method.

```javascript
/**
 * src/lib/loadRemoteModule.js
 */

import { createLoadRemoteModule } from "@paciolan/remote-module-loader";
import axios from "axios";

const fetcher = url => axios.get(url).then(request => request.data);

export default createLoadRemoteModule({ fetcher });
```

# Usage

Modules are loaded asynchronously, so use similar techniques to any other async function.

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

# Contributors

Joel Thoms (jthoms@paciolan.com)

Icon made by [Freepik](https://www.flaticon.com/authors/freepik) from [www.flaticon.com](www.flaticon.com)
