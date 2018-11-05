export default function createErrorHandler(mapError = _mapError) {
  return next => async req => {
    try {
      return await next(req);
    } catch (err) {
      if (err.response) {
        console.log(err);

        Object.assign(err, mapError(await err.response.json()));
      } else {
        console.error(err);
      }

      throw err;
    }
  };
}

function _mapError(json) {
  return {
    name: "HttpError",
    data: json
  };
}
