// C:\dev\egdesk-FreeSMS\scratch\check_db.js
const { queryTable } = require('../egdesk-helpers.js');

async function check() {
  try {
    const res = await queryTable('shared_dashboards', {});
    console.log("SHARED DASHBOARDS TOTAL COUNT:", res.rows ? res.rows.length : 0);
    if (res.rows) {
      res.rows.forEach((row, i) => {
        console.log(`[${i+1}] share_id: ${row.share_id}, title: ${row.title}, custom_title: ${row.custom_title}, is_pinned: ${row.is_pinned}, is_active: ${row.is_active}`);
      });
    }
  } catch (err) {
    console.error("DB QUERY ERROR:", err);
  }
}

check();
