import express from "express";
import bcrypt from "bcrypt";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";
import db from "./db.js";

// --- RECRÉATION DE __dirname POUR LES ES MODULES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES ---
// Permet de lire les données envoyées par les formulaires HTML (POST)
app.use(express.urlencoded({ extended: true }));
// Permet de lire les données envoyées en JSON
app.use(express.json());

// Indique à Express que tous tes fichiers front-end (HTML, CSS, JS, images) sont dans le dossier "public"
app.use(express.static(path.join(__dirname, "public")));

// --- CONFIGURATION DES SESSIONS ---
app.use(
  session({
    secret: "mon_super_secret_stageflow", // Une clé secrète pour crypter la session
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // secure: false car tu es en HTTP (localhost) et pas HTTPS
  }),
);

// --- DÉMARRAGE DU SERVEUR ---
app.listen(PORT, () => {
  console.log(`🚀 Serveur StageFlow démarré sur http://localhost:${PORT}`);
  console.log(`📂 Le dossier "public" est servi statiquement.`);
});

// --- ROUTES DE TEST ---

// Une route d'API pour vérifier que Node arrive bien à lire tes étudiants dans MySQL
app.get("/api/test-etudiants", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT nom_etudiant, prenom_etudiant, classe FROM etudiant",
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// --- ROUTE : INSCRIPTION D'UN ÉTUDIANT ---
app.post("/api/register/etudiant", async (req, res) => {
  try {
    // 1. On récupère TOUTES les données du formulaire HTML
    const {
      nom_etudiant,
      prenom_etudiant,
      date_naissance,
      num_INE,
      classe,
      formation_etudiant,
      email_academique,
      email_etudiant,
      num_telephone,
      adresse,
      code_postal,
      mdp_etudiant,
      mdp_confirm,
    } = req.body;

    // 2. Vérification des mots de passe
    if (mdp_etudiant !== mdp_confirm) {
      return res
        .status(400)
        .send("Erreur : Les mots de passe ne correspondent pas.");
    }

    // 3. Hachage du mot de passe
    const hashedMdp = await bcrypt.hash(mdp_etudiant, 10);

    // 4. La grosse requête SQL avec TOUTES les colonnes
    // Attention à bien avoir le même nombre de "?" que de colonnes !
    const sql = `
            INSERT INTO etudiant (
                nom_etudiant, 
                prenom_etudiant, 
                date_naissance, 
                num_INE, 
                classe, 
                formation_etudiant, 
                email_academique, 
                email_etudiant, 
                num_telephone, 
                adresse, 
                code_postal, 
                mdp_etudiant
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    // 5. On exécute la requête en plaçant les variables exactement dans le même ordre que les "?"
    await db.query(sql, [
      nom_etudiant,
      prenom_etudiant,
      date_naissance || null, // Le "|| null" permet d'envoyer NULL à la BDD si le champ est vide
      num_INE || null,
      classe || null,
      formation_etudiant || null,
      email_academique,
      email_etudiant || null,
      num_telephone || null,
      adresse || null,
      code_postal || null,
      hashedMdp,
    ]);

    // 6. Succès -> Redirection
    res.redirect("/connexion.html?success=1");
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    res.status(500).send("Aïe, une erreur est survenue pendant l'inscription.");
  }
});

// --- ROUTE : INSCRIPTION D'UNE ENTREPRISE ---
app.post("/api/register/entreprise", async (req, res) => {
  try {
    // 1. On récupère TOUTES les données du formulaire HTML Entreprise
    const {
      nom_entreprise,
      siret,
      secteur_activite,
      adresse_siege,
      code_postal,
      ville,
      nom_contact,
      email_entreprise,
      tel_contact,
      mdp_entreprise,
      mdp_confirm,
    } = req.body;

    // 2. Vérification des mots de passe
    if (mdp_entreprise !== mdp_confirm) {
      return res
        .status(400)
        .send("Erreur : Les mots de passe ne correspondent pas.");
    }

    // 3. Hachage du mot de passe
    const hashedMdp = await bcrypt.hash(mdp_entreprise, 10);

    // 4. La requête SQL pour la table 'entreprise'
    const sql = `
            INSERT INTO entreprise (
                nom_entreprise, 
                siret, 
                secteur_activite, 
                adresse_siege, 
                code_postal, 
                ville, 
                nom_contact, 
                email_entreprise, 
                tel_contact, 
                mdp_entreprise
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    // 5. On exécute la requête (les "|| null" gèrent les champs non obligatoires)
    await db.query(sql, [
      nom_entreprise,
      siret,
      secteur_activite || null,
      adresse_siege || null,
      code_postal || null,
      ville || null,
      nom_contact,
      email_entreprise,
      tel_contact || null,
      hashedMdp,
    ]);

    // 6. Succès -> Redirection vers la connexion
    res.redirect("/connexion.html?success=1");
  } catch (error) {
    console.error("Erreur lors de l'inscription de l'entreprise :", error);
    res
      .status(500)
      .send(
        "Aïe, une erreur est survenue pendant l'inscription de l'entreprise.",
      );
  }
});

// --- ROUTE : CONNEXION (LOGIN) AVEC ALERT ---
app.post("/api/login", async (req, res) => {
  try {
    const { email, mdp } = req.body;

    // 1. Recherche ÉTUDIANT
    const [etudiants] = await db.query(
      "SELECT * FROM etudiant WHERE email_academique = ? OR email_etudiant = ?",
      [email, email],
    );

    if (etudiants.length > 0) {
      const user = etudiants[0];
      const match = await bcrypt.compare(mdp, user.mdp_etudiant);

      if (match) {
        req.session.userId = user.id_etudiant;
        req.session.role = "etudiant";
        req.session.nom = user.prenom_etudiant;

        return res.json({
          success: true,
          message: `Connexion réussie ! Bienvenue ${user.prenom_etudiant}.`,
          redirect: "/index.html?success=1",
        });
      }
    }

    // 2. Recherche ENTREPRISE
    const [entreprises] = await db.query(
      "SELECT * FROM entreprise WHERE email_entreprise = ?",
      [email],
    );

    if (entreprises.length > 0) {
      const user = entreprises[0];
      const match = await bcrypt.compare(mdp, user.mdp_entreprise);

      if (match) {
        req.session.userId = user.id_entreprise;
        req.session.role = "entreprise";
        req.session.nom = user.nom_entreprise;

        return res.json({
          success: true,
          message: `Connexion réussie ! Bienvenue ${user.nom_entreprise}.`,
          redirect: "/entreprise/entreprise-dashboard.html",
        });
      }
    }

    // 3. Recherche ADMIN
    const [admins] = await db.query(
      "SELECT * FROM admin WHERE email_admin = ?",
      [email],
    );

    if (admins.length > 0) {
      const user = admins[0];
      const match = await bcrypt.compare(mdp, user.mdp_admin);

      if (match) {
        req.session.userId = user.id_admin;
        req.session.role = "admin";
        req.session.nom = user.prenom_admin;

        return res.json({
          success: true,
          message: `Connexion réussie ! Bienvenue Administrateur ${user.prenom_admin}.`,
          redirect: "/admin/dashboard.html",
        });
      }
    }

    // 4. Si aucune correspondance trouvée (Mauvais MDP ou Email)
    res.status(401).json({
      success: false,
      message: "Erreur : Email ou mot de passe incorrect.",
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion.",
    });
  }
});

// --- ROUTE : VÉRIFIER QUI EST CONNECTÉ ---
app.get("/api/session", (req, res) => {
  // Si l'utilisateur est connecté, req.session.userId existe
  if (req.session.userId) {
    res.json({
      isConnected: true,
      role: req.session.role,
      nom: req.session.nom,
    });
  } else {
    res.json({
      isConnected: false,
      role: "visiteur",
    });
  }
});

// --- ROUTE : DÉCONNEXION (LOGOUT) ---
app.get("/api/logout", (req, res) => {
  // On détruit la session de l'utilisateur
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion :", err);
      return res.status(500).send("Erreur lors de la déconnexion.");
    }
    // Une fois la session détruite, on le renvoie vers la page d'accueil !
    res.redirect("/index.html");
  });
});

// ==========================================================================
// ROUTE : RÉCUPÉRER TOUTES LES OFFRES ACTIVES
// ==========================================================================
app.get("/api/offres", async (req, res) => {
  try {
    // On va chercher les offres ET le nom de l'entreprise qui l'a publiée
    const [offres] = await db.query(`
      SELECT offre.*, entreprise.nom_entreprise 
      FROM offre 
      JOIN entreprise ON offre.id_entreprise = entreprise.id_entreprise
      WHERE offre.statut = 'active'
      ORDER BY offre.date_publication DESC
    `);

    res.json({ success: true, offres: offres });
  } catch (error) {
    console.error("Erreur lors de la récupération des offres :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : RÉCUPÉRER UNE OFFRE SPÉCIFIQUE + VÉRIFIER LA CANDIDATURE
// ==========================================================================
app.get("/api/offres/:id", async (req, res) => {
  try {
    const idOffre = req.params.id;

    // 1. On va chercher l'offre
    const [offres] = await db.query(
      `
      SELECT offre.*, entreprise.nom_entreprise, entreprise.secteur_activite, entreprise.ville 
      FROM offre 
      JOIN entreprise ON offre.id_entreprise = entreprise.id_entreprise
      WHERE offre.id_offre = ?
    `,
      [idOffre],
    );

    if (offres.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Offre introuvable" });
    }

    // 2. On vérifie qui est connecté
    const role = req.session.role || null;
    let hasApplied = false;

    // 3. Si c'est un étudiant, on vérifie s'il a déjà postulé à CETTE offre
    if (role === "etudiant" && req.session.userId) {
      const [candidatures] = await db.query(
        "SELECT * FROM postule WHERE id_etudiant = ? AND id_offre = ?",
        [req.session.userId, idOffre],
      );

      if (candidatures.length > 0) {
        hasApplied = true; // Il a déjà postulé !
      }
    }

    // 4. On renvoie tout au navigateur
    res.json({
      success: true,
      offre: offres[0],
      role: role,
      hasApplied: hasApplied,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'offre :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : Récupérer le profil (Universel : Etudiant, Entreprise, Admin)
// ==========================================================================
app.get("/api/profil", async (req, res) => {
  try {
    // 1. Vérifier qu'il y a bien quelqu'un de connecté
    if (!req.session.role || !req.session.userId) {
      return res.status(401).json({ success: false, message: "Non connecté" });
    }

    // 2. On déclare `rows` EN DEHORS des if pour qu'il survive jusqu'à la fin !
    let rows = [];

    // 3. On utilise "AS" pour que le résultat ait toujours les mêmes noms (nom, prenom, email, telephone)
    if (req.session.role === "etudiant") {
      [rows] = await db.query(
        "SELECT nom_etudiant AS nom, prenom_etudiant AS prenom, email_etudiant AS email, num_telephone AS telephone FROM etudiant WHERE id_etudiant = ?",
        [req.session.userId],
      );
    } else if (req.session.role === "entreprise") {
      [rows] = await db.query(
        "SELECT nom_entreprise AS nom, nom_contact AS prenom, email_entreprise AS email, tel_contact AS telephone FROM entreprise WHERE id_entreprise = ?",
        [req.session.userId],
      );
    } else if (req.session.role === "admin") {
      [rows] = await db.query(
        "SELECT nom_admin AS nom, prenom_admin AS prenom, email_admin AS email, '' AS telephone FROM admin WHERE id_admin = ?",
        [req.session.userId],
      );
    }

    // 4. Si on n'a rien trouvé
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Profil introuvable" });
    }

    // 5. Là, "rows" existe toujours !
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : MODIFIER LE MOT DE PASSE DE L'ÉTUDIANT
// ==========================================================================
app.post("/api/etudiant/mot-de-passe", async (req, res) => {
  try {
    // 1. Vérifier que c'est bien un étudiant connecté
    if (req.session.role !== "etudiant" || !req.session.userId) {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const { ancienMdp, nouveauMdp, confirmMdp } = req.body;

    // 2. Vérifier que les nouveaux mots de passe correspondent
    if (nouveauMdp !== confirmMdp) {
      return res.status(400).json({
        success: false,
        message: "Les nouveaux mots de passe ne correspondent pas.",
      });
    }

    // 3. Récupérer le hash du mot de passe ACTUEL dans la BDD
    const [etudiants] = await db.query(
      "SELECT mdp_etudiant FROM etudiant WHERE id_etudiant = ?",
      [req.session.userId],
    );

    if (etudiants.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur introuvable." });
    }

    const mdpActuelHashe = etudiants[0].mdp_etudiant;

    // 4. Comparer l'ancien mot de passe tapé avec celui de la BDD
    const match = await bcrypt.compare(ancienMdp, mdpActuelHashe);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "L'ancien mot de passe est incorrect.",
      });
    }

    // 5. Hasher le NOUVEAU mot de passe
    const nouveauHash = await bcrypt.hash(nouveauMdp, 10);

    // 6. Sauvegarder le nouveau hash dans la BDD
    await db.query(
      "UPDATE etudiant SET mdp_etudiant = ? WHERE id_etudiant = ?",
      [nouveauHash, req.session.userId],
    );

    res.json({
      success: true,
      message: "Votre mot de passe a été modifié avec succès !",
    });
  } catch (error) {
    console.error("Erreur lors de la modification du mot de passe :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});
