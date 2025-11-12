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
    
    // Validate configuration
    if (!config.server || !config.database || !config.user || !config.password) {
      const missing = [];
      if (!config.server) missing.push('AZURE_SQL_SERVER');
      if (!config.database) missing.push('AZURE_SQL_DATABASE');
      if (!config.user) missing.push('AZURE_SQL_USER');
      if (!config.password) missing.push('AZURE_SQL_PASSWORD');
      
      console.error('Missing SQL configuration:', missing);
      return res.status(500).json({ 
        error: 'Database configuration incomplete', 
        details: `Missing environment variables: ${missing.join(', ')}`,
        message: 'Please configure Azure SQL environment variables in Vercel'
      });
    }
    
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      SELECT id, name, email, age, city, salary, 
             FORMAT(createdAt, 'yyyy-MM-dd HH:mm:ss') as createdAt
      FROM TransportData
      ORDER BY id
    `);
    
    await pool.close();
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching SQL data:', error);
    
    // Provide more detailed error information
    let errorMessage = error.message;
    if (error.code === 'ETIMEOUT' || error.code === 'ESOCKET') {
      errorMessage = 'Cannot connect to Azure SQL Server. Check firewall rules and connection string.';
    } else if (error.code === 'ELOGIN') {
      errorMessage = 'Authentication failed. Check SQL credentials.';
    } else if (error.code === 'EREQUEST') {
      errorMessage = 'SQL query failed. Check if tables exist.';
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch SQL data', 
      details: errorMessage,
      code: error.code,
      message: 'Please check Azure SQL configuration and ensure tables are initialized'
    });
  }
};



