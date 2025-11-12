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
    
    // Clear the table
    await pool.request().query('DELETE FROM TransportData');
    
    // Log the action
    await pool.request()
      .input('level', sql.VarChar, 'info')
      .input('message', sql.VarChar, 'Table cleared by user')
      .input('details', sql.VarChar, 'All data removed from TransportData table')
      .query(`
        INSERT INTO ProcessLogs (timestamp, level, message, details)
        VALUES (GETUTCDATE(), @level, @message, @details)
      `);
    
    await pool.close();
    
    res.status(200).json({ message: 'Table cleared successfully' });
  } catch (error) {
    console.error('Error clearing table:', error);
    res.status(500).json({ 
      error: 'Failed to clear table', 
      details: error.message 
    });
  }
};


