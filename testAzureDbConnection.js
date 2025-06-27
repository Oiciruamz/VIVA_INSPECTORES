// testAzureDbConnection.js  –  Passwordless (MSAL Token + verificación)
const sql = require('mssql');
const { DefaultAzureCredential } = require('@azure/identity');

// === 1. Parámetros fijos (o lee de .env si lo prefieres) ===
const SERVER   = 'qc-server-insp.database.windows.net';   // FQDN exacto
const DATABASE = 'QC_INSP_DB';                            // ¡Tu base real!
 
// === 2. Pool singleton reutilizable ===
let poolPromise;

async function getPool () {
  if (poolPromise) return poolPromise;

  // 2.1 Token AAD – obtiene el access-token de az login o MSI
  const credential = new DefaultAzureCredential();                     // :contentReference[oaicite:0]{index=0}
  const { token }  = await credential.getToken(
    'https://database.windows.net/.default'                            // Scope oficial para Azure SQL :contentReference[oaicite:1]{index=1}
  );

  // 2.2 Config de conexión 100 % explícito
  const config = {
    server  : SERVER,
    database: DATABASE,
    authentication: {
      type   : 'azure-active-directory-access-token',
      options: { token }
    },
    options : {
      encrypt: true,               // TLS 1.2 obligatorio en Azure SQL :contentReference[oaicite:2]{index=2}
      trustServerCertificate: false,
      connectTimeout: 30000        // 30 s para el handshake TLS
    },
    pool: {
      idleTimeoutMillis: 60000     // evita que firewalls corten sockets inactivos
    }
  };

  // 2.3 Crea el pool y lo guarda
  poolPromise = sql.connect(config);
  return poolPromise;
}

// === 3. Función de prueba con verificación de contexto ===
async function testAzureDbConnection () {
  try {
    const pool = await getPool();

    // Consulta de autoverificación
    const { recordset } = await pool.request()
      .query('SELECT DB_NAME() AS db, CURRENT_USER AS usr;');

    console.log('✅ Conexión exitosa a Azure SQL Database');
    console.table(recordset);      // Debe mostrar QC_INSP_DB y tu usuario AAD
  } catch (err) {
    console.error('❌ Error de conexión:', err);
  } finally {
    if (poolPromise) await sql.close();   // cierra el pool cuando acaba
  }
}

testAzureDbConnection();
