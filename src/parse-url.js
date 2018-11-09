// Credits:
// https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript#answer-21553982

const reURL = new RegExp(
  [
    "^(https?:)//", // protocol
    "(([^:/?#]*)(?::([0-9]+))?)", // host (hostname and port)
    "(/{0,1}[^?#]*)", // pathname
    "(\\?[^#]*|)", // search
    "(#.*|)$" // hash
  ].join("")
);

export default function parseUrl(url) {
  const match = url.match(reURL);

  return (
    match && {
      protocol: match[1],
      host: match[2],
      hostname: match[3],
      port: match[4],
      pathname: match[5],
      search: match[6],
      hash: match[7]
    }
  );
}
