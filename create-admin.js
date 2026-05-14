import bcrypt from "bcrypt";
import mysql from "mysql2/promise"; // Utilise la même librairie que dans ton server.js

async function creerPremierAdmin() {
  try {
    // 1. Connexion à ta base de données (modifie le nom de la BDD si besoin)
    const db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "Piscine", // <-- CHANGER ICI avec le nom de ta BDD
    });

    // 2. Les infos de ton admin
    const nom = "Boss2";
    const prenom = "Admin2";
    const email = "admin2@stageflow.fr";
    const mdpEnClair = "admin"; // Le mot de passe facile pour tes tests

    // 3. On hash le mot de passe
    const hash = await bcrypt.hash(mdpEnClair, 10);

    // 4. On l'insère dans la table
    const [resultat] = await db.execute(
      "INSERT INTO admin (nom_admin, prenom_admin, email_admin, mdp_admin) VALUES (?, ?, ?, ?)",
      [nom, prenom, email, hash],
    );

    console.log("✅ SUCCÈS ! L'administrateur a été créé.");
    console.log(`📧 Email : ${email}`);
    console.log(`🔑 Mot de passe : ${mdpEnClair}`);

    // On ferme la connexion
    await db.end();
    process.exit();
  } catch (error) {
    console.error("❌ Erreur lors de la création :", error);
    process.exit(1);
  }
}

creerPremierAdmin();
