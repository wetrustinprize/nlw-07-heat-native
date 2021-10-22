import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.80:4000",
});

export { api };
