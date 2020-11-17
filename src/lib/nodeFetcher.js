const http = require("http");
const https = require("https");

/**
 * Get's a url. Compatible with http and https.
 * @param {string} url
 * @param  {...any} args
 */
const get = (url, ...args) => {
  if (typeof url !== "string") {
    return {
      on(eventName, callback) {
        callback(new Error("URL must be a string."));
      }
    };
  }
  return url.indexOf("https://") === 0
    ? https.get(url, ...args)
    : http.get(url, ...args);
};

/**
 * Get's a URL and returns a Promise
 * @param {string} url
 * @returns {Promise<string>}
 */
const nodeFetcher = url =>
  new Promise((resolve, reject) => {
    get(url, res => {
      let data = null;

      // called when a data chunk is received.
      res.on("data", chunk => {
        if (data === null) {
          data = chunk;
          return;
        }
        data += chunk;
      });

      // called when the complete response is received.
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });

export default nodeFetcher;
