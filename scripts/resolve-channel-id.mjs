const videoId = process.argv[2] || "2PO_Vy1JB4s";
const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
  headers: { "User-Agent": "Mozilla/5.0" },
});
const html = await res.text();
const ids = [...html.matchAll(/"channelId":"(UC[^"]+)"/g)].map((m) => m[1]);
const unique = [...new Set(ids)];
console.log(unique[0] ?? "not found");
console.log("all candidates:", unique);
