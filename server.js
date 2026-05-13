// 1. TOUS LES IMPORTS ICI (Une seule fois chacun)
import express from "express";
import bcrypt from "bcrypt";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import db from "./db.js";

// 2. RECRÉATION DE __dirname POUR LES ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. INITIALISATION DE L'APPLICATION
const app = express();
const PORT = process.env.PORT || 3000;

// 4. CONFIGURATION DE MULTER POUR LES CV
const cvDir = path.join(__dirname, "uploads", "cvs");
if (!fs.existsSync(cvDir)) {
  fs.mkdirSync(cvDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, cvDir);
  },
  filename: function (req, file, cb) {
    // On donne un nom unique : idEtudiant-date-nomdufichier.pdf
    const nomUnique =
      req.session.userId + "-" + Date.now() + path.extname(file.originalname);
    cb(null, nomUnique);
  },
});

const uploadCV = multer({ storage: storage });

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
// ROUTE : RECHERCHER DES OFFRES DE STAGE
// ==========================================================================
app.get("/api/offres", async (req, res) => {
  try {
    const { keyword, location } = req.query;

    // On sélectionne les champs et on joint la ville de l'entreprise
    // On ne prend que les offres disponibles (id_etudiant IS NULL)
    // ET dont le statut est explicitement 'active'
    let query = `
      SELECT o.*, e.nom_entreprise, e.ville
      FROM offre o
      JOIN entreprise e ON o.id_entreprise = e.id_entreprise
      WHERE o.id_etudiant IS NULL 
      AND o.statut = 'active'
    `;
    const params = [];

    // Recherche par mot clé (dans le titre de l'offre, la mission, ou le nom de l'entreprise)
    if (keyword) {
      query += ` AND (o.titre_offre LIKE ? OR o.mission LIKE ? OR e.nom_entreprise LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
    }

    // Recherche par ville (qui est dans la table entreprise)
    if (location) {
      query += ` AND e.ville LIKE ?`;
      const searchLocation = `%${location}%`;
      params.push(searchLocation);
    }

    query += ` ORDER BY o.date_publication DESC`;

    const [offres] = await db.query(query, params);
    res.json({ success: true, data: offres });
  } catch (error) {
    console.error("Erreur lors de la recherche d'offres :", error);
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
        "SELECT nom_entreprise AS nom, nom_contact AS prenom, email_entreprise AS email, tel_contact AS telephone, siret, secteur_activite AS secteur FROM entreprise WHERE id_entreprise = ?",
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
// ROUTE : MODIFIER LE MOT DE PASSE (Universel)
// ==========================================================================
app.post("/api/mot-de-passe", async (req, res) => {
  try {
    const role = req.session.role;
    const userId = req.session.userId;

    if (!role || !userId) {
      return res.status(401).json({ success: false, message: "Non connecté" });
    }

    const { ancienMdp, nouveauMdp, confirmMdp } = req.body;

    if (nouveauMdp !== confirmMdp) {
      return res.status(400).json({
        success: false,
        message: "Les mots de passe ne correspondent pas.",
      });
    }

    // On prépare les requêtes en fonction du rôle
    let table = "";
    let idColumn = "";
    let mdpColumn = "";

    if (role === "etudiant") {
      table = "etudiant";
      idColumn = "id_etudiant";
      mdpColumn = "mdp_etudiant";
    } else if (role === "entreprise") {
      table = "entreprise";
      idColumn = "id_entreprise";
      mdpColumn = "mdp_entreprise";
    } else if (role === "admin") {
      table = "admin";
      idColumn = "id_admin";
      mdpColumn = "mdp_admin";
    }

    // On va chercher le hash actuel
    const [users] = await db.query(
      `SELECT ${mdpColumn} AS hash FROM ${table} WHERE ${idColumn} = ?`,
      [userId],
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur introuvable." });
    }

    // On compare l'ancien mdp
    const match = await bcrypt.compare(ancienMdp, users[0].hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "L'ancien mot de passe est incorrect.",
      });
    }

    // On sauvegarde le nouveau
    const nouveauHash = await bcrypt.hash(nouveauMdp, 10);
    await db.query(
      `UPDATE ${table} SET ${mdpColumn} = ? WHERE ${idColumn} = ?`,
      [nouveauHash, userId],
    );

    res.json({ success: true, message: "Mot de passe modifié avec succès !" });
  } catch (error) {
    console.error("Erreur Mdp :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : MODIFIER LE PROFIL (Universel)
// ==========================================================================
app.put("/api/profil", async (req, res) => {
  try {
    const role = req.session.role;
    const userId = req.session.userId;

    if (!role || !userId) {
      return res.status(401).json({ success: false, message: "Non connecté" });
    }

    // On récupère les données envoyées par le JavaScript
    const { nom, prenom, email, telephone, secteur } = req.body;

    // On met à jour la bonne table selon le rôle
    if (role === "etudiant") {
      await db.query(
        "UPDATE etudiant SET nom_etudiant = ?, prenom_etudiant = ?, email_etudiant = ?, num_telephone = ? WHERE id_etudiant = ?",
        [nom, prenom, email, telephone, userId],
      );
    } else if (role === "entreprise") {
      // Pour l'entreprise, "prenom" correspond au nom du contact
      await db.query(
        "UPDATE entreprise SET nom_entreprise = ?, nom_contact = ?, email_entreprise = ?, tel_contact = ?, secteur_activite = ? WHERE id_entreprise = ?",
        [nom, prenom, email, telephone, secteur, userId],
      );
    } else if (role === "admin") {
      await db.query(
        "UPDATE admin SET nom_admin = ?, prenom_admin = ?, email_admin = ? WHERE id_admin = ?",
        [nom, prenom, email, userId],
      );
    }

    res.json({
      success: true,
      message: "Vos informations ont été mises à jour !",
    });
  } catch (error) {
    console.error("Erreur lors de la modification du profil :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : SUIVI DES CANDIDATURES (Étudiant)
// ==========================================================================
app.get("/api/mes-candidatures", async (req, res) => {
  try {
    if (req.session.role !== "etudiant" || !req.session.userId) {
      return res.status(401).json({ success: false, message: "Non connecté" });
    }
    const [candidatures] = await db.query(
      `
      SELECT postule.*, offre.titre_offre, entreprise.nom_entreprise
      FROM postule
      JOIN offre ON postule.id_offre = offre.id_offre
      JOIN entreprise ON offre.id_entreprise = entreprise.id_entreprise
      WHERE postule.id_etudiant = ?
      `,
      [req.session.userId],
    );

    res.json({ success: true, data: candidatures });
  } catch (error) {
    console.error("Erreur lors du suivi des candidatures :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : RÉCUPÉRER LE CARNET DE STAGE (Étudiant)
// ==========================================================================
app.get("/api/carnet-stage", async (req, res) => {
  try {
    // Vérification de la session
    if (req.session.role !== "etudiant" || !req.session.userId) {
      return res.status(401).json({ success: false, message: "Non connecté" });
    }

    const [stages] = await db.query(
      `
      SELECT carnet_stage.*, entreprise.nom_entreprise 
      FROM carnet_stage 
      JOIN entreprise ON carnet_stage.id_entreprise = entreprise.id_entreprise
      WHERE carnet_stage.id_etudiant = ?
      ORDER BY carnet_stage.date_debut DESC
    `,
      [req.session.userId],
    );

    res.json({ success: true, data: stages });
  } catch (error) {
    console.error("Erreur Carnet de Stage :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : STAGE EFFECTUE (Étudiant) - Ajout manuel depuis la modale
// ==========================================================================
app.post("/api/stage-effectue", async (req, res) => {
  try {
    if (req.session.role !== "etudiant" || !req.session.userId) {
      return res.status(401).json({ success: false, message: "Non connecté" });
    }

    // On récupère les données envoyées par la modale
    const { entreprise, mission, dateDebut, dateFin, tuteur } = req.body;

    // 1. On cherche si l'entreprise existe déjà par son nom
    const [entreprisesExistant] = await db.query(
      "SELECT id_entreprise FROM entreprise WHERE nom_entreprise = ?",
      [entreprise],
    );

    let idEntreprise;

    if (entreprisesExistant.length > 0) {
      // Elle existe ! On prend son ID.
      idEntreprise = entreprisesExistant[0].id_entreprise;
    } else {
      // Elle n'existe pas ! On la crée pour avoir un ID.
      const [nouvelleEntreprise] = await db.query(
        "INSERT INTO entreprise (nom_entreprise) VALUES (?)",
        [entreprise],
      );
      idEntreprise = nouvelleEntreprise.insertId;
    }

    // 2. On insère le stage dans le carnet avec le bon ID d'entreprise
    await db.query(
      "INSERT INTO carnet_stage (id_etudiant, id_entreprise, date_debut, date_fin, mission, tuteur) VALUES (?, ?, ?, ?, ?, ?)",
      [req.session.userId, idEntreprise, dateDebut, dateFin, mission, tuteur],
    );

    res.json({ success: true, message: "Stage ajouté avec succès !" });
  } catch (error) {
    console.error("Erreur lors de l'ajout du stage :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : LISTE DES ENTREPRISES (Pour le menu déroulant)
// ==========================================================================
app.get("/api/entreprises", async (req, res) => {
  try {
    const [entreprises] = await db.query(
      "SELECT id_entreprise, nom_entreprise FROM entreprise ORDER BY nom_entreprise ASC",
    );
    res.json({ success: true, data: entreprises });
  } catch (error) {
    console.error("Erreur liste entreprises :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : SUPPRIMER UN STAGE DU CARNET
// ==========================================================================
app.delete("/api/stage-effectue/:id", async (req, res) => {
  try {
    if (req.session.role !== "etudiant" || !req.session.userId) {
      return res.status(401).json({ success: false, message: "Non autorisé" });
    }

    const idStage = req.params.id;

    // On vérifie que le stage appartient bien à l'étudiant connecté avant de supprimer
    const [result] = await db.query(
      "DELETE FROM carnet_stage WHERE id_carnet = ? AND id_etudiant = ?",
      [idStage, req.session.userId],
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Stage supprimé avec succès." });
    } else {
      res.status(404).json({ success: false, message: "Stage non trouvé." });
    }
  } catch (error) {
    console.error("Erreur suppression stage :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : MODIFIER UN STAGE EXISTANT (Méthode PUT)
// ==========================================================================
app.put("/api/stage-effectue/:id", async (req, res) => {
  try {
    if (req.session.role !== "etudiant" || !req.session.userId) {
      return res.status(401).json({ success: false, message: "Non connecté" });
    }

    const idStage = req.params.id;
    const { entreprise, mission, dateDebut, dateFin, tuteur } = req.body;

    // 1. Logique de l'entreprise (on cherche son ID ou on la crée)
    const [entreprisesExistant] = await db.query(
      "SELECT id_entreprise FROM entreprise WHERE nom_entreprise = ?",
      [entreprise],
    );

    let idEntreprise;
    if (entreprisesExistant.length > 0) {
      idEntreprise = entreprisesExistant[0].id_entreprise;
    } else {
      const [nouvelle] = await db.query(
        "INSERT INTO entreprise (nom_entreprise) VALUES (?)",
        [entreprise],
      );
      idEntreprise = nouvelle.insertId;
    }

    // 2. On met à jour le carnet (en vérifiant que c'est bien l'étudiant connecté qui modifie SON stage)
    await db.query(
      "UPDATE carnet_stage SET id_entreprise = ?, date_debut = ?, date_fin = ?, mission = ?, tuteur = ? WHERE id_carnet = ? AND id_etudiant = ?",
      [
        idEntreprise,
        dateDebut,
        dateFin,
        mission,
        tuteur,
        idStage,
        req.session.userId,
      ],
    );

    res.json({ success: true, message: "Stage mis à jour avec succès !" });
  } catch (error) {
    console.error("Erreur modif stage :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================================================================
// ROUTE : POSTULER À UNE OFFRE (Avec Upload de CV et Lettre)
// ==========================================================================
app.post("/api/postuler", uploadCV.single("cv"), async (req, res) => {
  try {
    // 1. Vérifions si l'étudiant est bien connecté
    if (req.session.role !== "etudiant" || !req.session.userId) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Vous devez être connecté pour postuler.",
        });
    }

    // 2. On récupère TOUTES les infos, y compris la lettre !
    const { idOffre, lettreMotivation } = req.body;
    const idEtudiant = req.session.userId;
    const dateCandidature = new Date().toISOString().split("T")[0];

    // 3. On récupère le nom du CV sauvegardé par Multer
    const nomFichierCV = req.file ? req.file.filename : null;

    if (!nomFichierCV) {
      return res
        .status(400)
        .json({ success: false, message: "Le CV est obligatoire." });
    }

    // 4. ON INSERE DANS LA BDD (avec le cv_fichier ET la lettre_motivation)
    await db.query(
      "INSERT INTO postule (id_etudiant, id_offre, date_candidature, statut, cv_fichier, lettre_motivation) VALUES (?, ?, ?, 'En attente', ?, ?)",
      [idEtudiant, idOffre, dateCandidature, nomFichierCV, lettreMotivation],
    );

    res.json({ success: true, message: "Candidature envoyée avec succès !" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Vous avez déjà postulé à cette offre !",
        });
    }
    // C'EST ICI QUE L'ERREUR 500 S'AFFICHE DANS TON TERMINAL
    console.error("Erreur candidature :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});
