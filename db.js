import mysql from "mysql2/promise";

// Création du pool de connexion en utilisant les variables du fichier .env
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  authPlugins: {                          // 👈 ajoute ça
    mysql_native_password: () => () => Buffer.from(process.env.DB_PASSWORD + '\0')
  }
});

// Petit test pour vérifier que la base de données répond bien au démarrage
pool
  .getConnection()
  .then((connection) => {
    console.log(
      '✅ Connecté avec succès à la base de données MySQL "Piscine" !',
    );
    connection.release(); // On libère la connexion une fois le test fini
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion à la base de données :", err.message);
  });

export default pool;
