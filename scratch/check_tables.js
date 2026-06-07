const helpers = require('../egdesk-helpers.js');

async function main() {
  try {
    const tables = await helpers.listTables();
    console.log("=== Available Tables ===");
    console.log(JSON.stringify(tables, null, 2));
  } catch (err) {
    console.error("Error listing tables:", err);
  }
}

main();
