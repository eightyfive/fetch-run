const o = Object;

export default function qs(params) {
  let query = [];

  for (const [key, value] of o.entries(params)) {
    if (value === null) {
      query.push(`${key}=`);
    } else if (typeof value === 'object') {
      query.push(`${key}=${JSON.stringify(value)}`);
    } else {
      query.push(`${key}=${value}`);
    }
  }

  return query.join('&');
}
