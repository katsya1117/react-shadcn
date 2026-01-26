// モック用の API 設定
const apiBasePath = "/api";

const Config = {
  apiConfig: {
    basePath: apiBasePath,
  },
  apiOption: {
    headers: {
      "x-jcl-user": "mock-user",
    },
  },
};

export default Config;
