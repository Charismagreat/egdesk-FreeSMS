const { listTables } = require('../egdesk-helpers');

async function test() {
  try {
    const res = await listTables();
    console.log('listTables() return type:', typeof res);
    console.log('Is Array?', Array.isArray(res));
    console.log('Raw return keys:', Object.keys(res));
    console.log('Raw return details:', JSON.stringify(res, null, 2).slice(0, 1000));
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
