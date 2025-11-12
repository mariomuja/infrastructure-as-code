const { BlobServiceClient } = require('@azure/storage-blob');
const sql = require('mssql');

const CHUNK_SIZE = 100; // Process 100 records at a time for better performance with large CSV files

// Initialize database tables if they don't exist
async function initializeDatabase() {
  try {
    const config = {
      server: process.env.AZURE_SQL_SERVER || '',
      database: process.env.AZURE_SQL_DATABASE || '',
      user: process.env.AZURE_SQL_USER || '',
      password: process.env.AZURE_SQL_PASSWORD || '',
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };

    const pool = await sql.connect(config);
    
    // Create TransportData table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TransportData]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[TransportData] (
          [id] INT NOT NULL PRIMARY KEY,
          [name] NVARCHAR(255) NOT NULL,
          [email] NVARCHAR(255) NOT NULL,
          [age] INT NOT NULL,
          [city] NVARCHAR(100) NOT NULL,
          [salary] DECIMAL(18, 2) NOT NULL,
          [createdAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
        CREATE INDEX IX_TransportData_CreatedAt ON [dbo].[TransportData]([createdAt]);
      END
    `);
    
    // Create ProcessLogs table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProcessLogs]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[ProcessLogs] (
          [id] INT IDENTITY(1,1) PRIMARY KEY,
          [timestamp] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          [level] NVARCHAR(50) NOT NULL,
          [message] NVARCHAR(MAX) NOT NULL,
          [details] NVARCHAR(MAX) NULL
        );
        CREATE INDEX IX_ProcessLogs_Timestamp ON [dbo].[ProcessLogs]([timestamp] DESC);
        CREATE INDEX IX_ProcessLogs_Level ON [dbo].[ProcessLogs]([level]);
      END
    `);
    
    await pool.close();
  } catch (error) {
    console.error('Error initializing database:', error);
    // Don't throw - allow function to continue
  }
}

async function logToDatabase(level, message, details) {
  try {
    const config = {
      server: process.env.AZURE_SQL_SERVER || '',
      database: process.env.AZURE_SQL_DATABASE || '',
      user: process.env.AZURE_SQL_USER || '',
      password: process.env.AZURE_SQL_PASSWORD || '',
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };

    const pool = await sql.connect(config);
    await pool.request()
      .input('level', sql.VarChar, level)
      .input('message', sql.VarChar, message)
      .input('details', sql.VarChar, details || '')
      .query(`
        INSERT INTO ProcessLogs (timestamp, level, message, details)
        VALUES (GETUTCDATE(), @level, @message, @details)
      `);
    await pool.close();
  } catch (error) {
    console.error('Error logging to database:', error);
  }
}

function parseCsv(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    records.push(record);
  }

  return records;
}

async function insertChunk(records, chunkNumber, totalChunks) {
  try {
    const config = {
      server: process.env.AZURE_SQL_SERVER || '',
      database: process.env.AZURE_SQL_DATABASE || '',
      user: process.env.AZURE_SQL_USER || '',
      password: process.env.AZURE_SQL_PASSWORD || '',
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };

    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      for (const record of records) {
        const request = new sql.Request(transaction);
        await request
          .input('id', sql.Int, parseInt(record.id))
          .input('name', sql.VarChar, record.name)
          .input('email', sql.VarChar, record.email)
          .input('age', sql.Int, parseInt(record.age))
          .input('city', sql.VarChar, record.city)
          .input('salary', sql.Decimal(18, 2), parseFloat(record.salary))
          .query(`
            INSERT INTO TransportData (id, name, email, age, city, salary, createdAt)
            VALUES (@id, @name, @email, @age, @city, @salary, GETUTCDATE())
          `);
      }

      await transaction.commit();
      await logToDatabase(
        'info',
        `Chunk ${chunkNumber}/${totalChunks} processed successfully`,
        `Inserted ${records.length} records`
      );
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await pool.close();
    }
  } catch (error) {
    await logToDatabase(
      'error',
      `Error processing chunk ${chunkNumber}/${totalChunks}`,
      error.message || String(error)
    );
    throw error;
  }
}

module.exports = async function (context, myBlob) {
  context.log(`Blob trigger function processed blob: ${context.bindingData.name}`);

  try {
    // Initialize database tables on first run
    await initializeDatabase();
    
    await logToDatabase('info', 'CSV file detected in blob storage', `File: ${context.bindingData.name}`);

    const csvContent = myBlob.toString('utf-8');
    const records = parseCsv(csvContent);

    if (records.length === 0) {
      await logToDatabase('warning', 'CSV file is empty or invalid', `File: ${context.bindingData.name}`);
      return;
    }

    await logToDatabase('info', `Parsed ${records.length} records from CSV`, `File: ${context.bindingData.name}`);

    // Split into chunks
    const chunks = [];
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      chunks.push(records.slice(i, i + CHUNK_SIZE));
    }

    await logToDatabase('info', `Split into ${chunks.length} chunks`, `Chunk size: ${CHUNK_SIZE}`);

    // Process chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      await insertChunk(chunks[i], i + 1, chunks.length);
      context.log(`Processed chunk ${i + 1}/${chunks.length}`);
    }

    await logToDatabase('info', 'CSV processing completed successfully', `Total records: ${records.length}`);
  } catch (error) {
    const errorMessage = error.message || String(error);
    context.log.error(`Error processing CSV: ${errorMessage}`);
    await logToDatabase('error', 'CSV processing failed', errorMessage);
    throw error;
  }
};

