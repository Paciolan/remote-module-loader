import { DONE } from "./readyState";
import { OK } from "./status";
import { Fetcher } from "../../models";

const xmlHttpRequestFetcher: Fetcher = url =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== DONE) return;
      xhr.status === OK
        ? resolve(xhr.responseText)
        : reject(`${xhr.status} ${xhr.statusText}`);
    };
    xhr.open("GET", url, true);
    xhr.send();
  });

export default xmlHttpRequestFetcher;
