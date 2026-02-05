const http = require("http");
const https = require("https");
const zlib = require("zlib");

module.exports = async (req, res) => {
  const get = (url, headers) =>
    new Promise((resolve, reject) => {
      const lib = url.startsWith("https") ? https : http;
      const request = lib.get(url, { headers }, (response) => {
        let chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const buffer = Buffer.concat(chunks);

          
          const encoding = response.headers["content-encoding"];
          try {
            if (encoding === "gzip") {
              zlib.gunzip(buffer, (err, decoded) => {
                if (err) return reject(err);
                resolve(decoded.toString());
              });
            } else if (encoding === "deflate") {
              zlib.inflate(buffer, (err, decoded) => {
                if (err) return reject(err);
                resolve(decoded.toString());
              });
            } else {
              resolve(buffer.toString());
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      request.on("error", reject);
    });

  const { type } = Object.fromEntries(
    new URL(req.url, "http://localhost").searchParams
  );

  if (!type) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Missing ?type parameter" }));
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 15; V2423 Build/AP3A.240905.015.A2_D1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.109 Mobile Safari/537.36",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "en-US,en;q=0.9",
    Cookie: "PHPSESSID=iglrt9u9umt7d00qvqc4nc3of9",
  };

  let url;

  if (type === "numbers") {
    url =
      "http://85.195.94.50/sms/dialer/ajax/dt_numbers.php?ftermination=&sEcho=2&iColumns=3&sColumns=%2C%2C&iDisplayStart=0&iDisplayLength=-1&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=asc&iSortingCols=1&_=1770282541620";
    headers.Referer =
      "http://85.195.94.50/sms/dialer/AssignedNumbers";
  } else if (type === "message") {
    url =
      "http://85.195.94.50/smssms/dialer/ajax/dt_terminations.php?sEcho=1&iColumns=3&sColumns=%2C%2C&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=asc&iSortingCols=1&_=1770282536062";
    headers.Referer =
      "http://85.195.94.50/sms/dialer/SMSReports";
  } else {
    res.statusCode = 400;
    return res.end(
      JSON.stringify({ error: "Invalid type (use sms or numbers)" })
    );
  }

  try {
    const data = await get(url, headers);
    res.setHeader("Content-Type", "application/json");
    res.end(data);
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Fetch failed", details: err.message }));
  }
};
