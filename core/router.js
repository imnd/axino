/**
 * parse routes
 */
const parseRoutes = routes => {
  const parsedRoutes = {
    get: [],
    post: [],
    put: [],
    delete: [],
  };

  for (let [requestParams, callback] of Object.entries(routes)) {
    const colonPos = requestParams.indexOf(":");
    let method,
        url = "",
        param = null,
        action = null;

    if (colonPos === -1) {
      method = requestParams;
    } else {
      method = requestParams.substring(0, colonPos);
      url = requestParams.substring(colonPos + 1);
      const urlArr = url.split("/");
      url = urlArr.shift();

      for (const [index, item] of urlArr.entries()) {
        if (-1 !== item.indexOf("{") && -1 !== item.indexOf("}")) {
          param = item.replace(/[\{\}]/gi, "");
          delete urlArr[index];
          break;
        }
      }
      action = urlArr[0] ?? null;
    }

    if (typeof callback !== "function") {
      callback = {
        controller: callback[0],
        action: callback[1],
      }
    }

    if (parsedRoutes[method][url] === undefined) {
      parsedRoutes[method][url] = [];
    }

    parsedRoutes[method][url].push({ callback, action, param });
  }

  return parsedRoutes;
};

/**
 * parse url
 */
const parseUrl = (request, routes) => {
  let url = request.url.replace(/^\/+/g, '');
  const requestUrlArr = url.split('/');
  url = requestUrlArr[0];
  const urlParam = requestUrlArr[1] ?? null;

  const method = request.method.toLowerCase();
  const methodRoutes = routes[method];
  if (Object.keys(methodRoutes).length === 0) {
    return null;
  }
  const urlRoutes = methodRoutes[url];
  if (!urlRoutes) {
    return null;
  }

  let filter;
  if (urlParam) {
    filter = item => (item.param !== null || item.action !== null);
  } else {
    filter = item => item.param === null;
  }

  const route = urlRoutes.filter(filter)[0] ?? null;

  if (route === null) {
    return null;
  }

  if (route.callback === null) {
    return null;
  }

  return {
    callback: route.callback,
    param: route.param ? urlParam : null,
    data: request.body,
  };
};

export { parseRoutes, parseUrl };
