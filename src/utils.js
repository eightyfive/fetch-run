const reJson = /([\/+])json$/;

// @var `re` (Request|Response)
export function isJson(re) {
  const contentType = re.headers.get('Content-Type');

  return reJson.test(contentType);
}
