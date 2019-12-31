export default function qs(params) {
  return Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&');
}
