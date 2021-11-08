import { Fetcher } from "../../models";
import { OK } from "../status";
import { DONE } from "./readyState";

const xmlHttpRequestFetcher: Fetcher = url =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== DONE) return;
      xhr.status === OK
        ? resolve(xhr.responseText)
        : reject(new Error(`HTTP Error Response: ${xhr.status} ${xhr.statusText} (${url})`))
    };
    xhr.open("GET", url, true);
    xhr.send();
  });

export default xmlHttpRequestFetcher;
