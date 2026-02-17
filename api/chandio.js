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

  // Header and Cookie Setup
  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 15; V2423) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Accept-Encoding": "gzip, deflate",
    "Cookie": "PHPSESSID=dg35g3hrj5kajf2j15m1ov2ji2",
  };

  let url;

  if (type === "numbers") {
    // Numbers Panel URL
    url = "http://45.82.67.20/ints/client/res/data_smsnumbers.php?sEcho=2&iDisplayStart=0&iDisplayLength=-1&iSortCol_0=0&sSortDir_0=asc";
    headers.Referer = "http://45.82.67.20/ints/client/MySMSNumbers";

  } else if (type === "sms") {
    // FIXED: '-' hata diya aur Date ko range mein rakha
    url = "http://45.82.67.20/ints/client/res/data_smscdr.php?fdate1=2024-01-01%2000:00:00&fdate2=2026-12-31%2023:59:59&sesskey=Q05RR0FQUEhBVQ==&sEcho=1&iDisplayStart=0&iDisplayLength=25&iSortCol_0=0&sSortDir_0=desc";
    headers.Referer = "http://45.82.67.20/ints/client/SMSCDRStats";

  } else {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Invalid type (use sms or numbers)" }));
  }

  try {
    const data = await get(url, headers);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*"); // Browser se fetch karne ke liye
    res.end(data);
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Fetch failed", details: err.message }));
  }
};
