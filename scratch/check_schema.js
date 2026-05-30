// C:\dev\egdesk-FreeSMS\scratch\check_schema.js
const { getTableSchema } = require('../egdesk-helpers.js');

async function check() {
  try {
    const res = await getTableSchema('shared_dashboards');
    console.log("SCHEMA RESPONSE:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("SCHEMA QUERY ERROR:", err);
  }
}

check();
