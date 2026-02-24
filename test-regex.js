const errorString = "Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint cc-699be5adb7ef892628d038e5-postgresql_deme-1 (18bf8c5e344f7d979eecf6e472b984ee434d755784bff0c1ff52a7a2d57b8991): failed to bind host port 0.0.0.0:5432/tcp: address already in use";

const regex = /:(\d+)(?:\/tcp)?.*(?:already in use|already allocated)/i;

const match = errorString.match(regex) || errorString.match(/Bind for.*:(\d+) failed/i);
console.log("Found port:", match ? match[1] : null);

const err2 = "Bind for 0.0.0.0:8080 failed: port is already allocated.";
const match2 = err2.match(regex) || err2.match(/Bind for.*:(\d+) failed/i);
console.log("Found port 2:", match2 ? match2[1] : null);
