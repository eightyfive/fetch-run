const isJson = /([\/+])json$/;

export default function jsonResponse(next) {
	return async req => {
		const res = await next(req);
		const contentType = res.headers.get('Content-Type');

		if (isJson.test(contentType)) {
			return await res.json();
		}

		return res;
	};
}
