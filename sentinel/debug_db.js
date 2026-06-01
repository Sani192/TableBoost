const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sentinel_test.db');
const db = new sqlite3.Database(dbPath);

console.log("=== DB DUMP ===");

db.serialize(() => {
  db.all("SELECT * FROM campaigns", (err, rows) => {
    console.log("CAMPAIGNS:");
    console.log(rows);
  });
  db.all("SELECT * FROM messages", (err, rows) => {
    console.log("MESSAGES:");
    console.log(rows);
  });
  db.all("SELECT * FROM visits WHERE customer_id = 1", (err, rows) => {
    console.log("VISITS FOR ALICE (ID=1):");
    console.log(rows);
  });
  db.all("SELECT * FROM campaign_summaries", (err, rows) => {
    console.log("CAMPAIGN SUMMARIES:");
    console.log(rows);
  });
});
