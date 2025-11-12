const sql = require('mssql');

async function getSqlConfig() {
  return {
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };
}

module.exports = async (req, res) => {
  try {
    const config = await getSqlConfig();
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      SELECT id, 
             FORMAT(timestamp, 'yyyy-MM-ddTHH:mm:ssZ') as timestamp,
             level, message, details
      FROM ProcessLogs
      ORDER BY timestamp DESC
    `);
    
    await pool.close();
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching process logs:', error);
    res.status(500).json({ error: 'Failed to fetch process logs', details: error.message });
  }
};


