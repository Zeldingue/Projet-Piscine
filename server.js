// 1. TOUS LES IMPORTS ICI (Une seule fois chacun)
import "dotenv/config";
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

// On autorise l'accès public au dossier des CV
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// ===========================================================================
// ROUTE : VÉRIFIER LA SESSION (Pour protéger les pages)
// ==========================================================================
app.get("/api/auth/status", (req, res) => {
  if (req.session && req.session.userId) {
    // Si une session existe
    res.json({ loggedIn: true, role: req.session.role });
  } else {
    // Si personne n'est connecté
    res.json({ loggedIn: false });
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

// --- ROUTE : CONNEXION (LOGIN) CORRIGÉE ---
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
        // VÉRIFICATION DU BANNISSEMENT ÉTUDIANT
        const [banCheck] = await db.query(
          "SELECT motif FROM bannissement WHERE id_etudiant = ?",
          [user.id_etudiant],
        );

        if (banCheck.length > 0) {
          return res.status(403).json({
            success: false,
            message: `Accès refusé. Votre compte étudiant a été banni pour le motif suivant : ${banCheck[0].motif}, \n Merci de contacter le support pour plus d'informations.`,
          });
        }

        // Si non banni, on crée la session
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
        // VÉRIFICATION DU BANNISSEMENT ENTREPRISE
        const [banCheck] = await db.query(
          "SELECT motif FROM bannissement WHERE id_entreprise = ?",
          [user.id_entreprise],
        );

        if (banCheck.length > 0) {
          return res.status(403).json({
            success: false,
            message: `Accès refusé. Le compte de votre entreprise a été banni. Motif : ${banCheck[0].motif} \n Merci de contacter le support pour plus d'informations.`,
          });
        }

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

    // 4. Si aucune correspondance trouvée
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

// Vérifier le statut d'une candidature pour l'étudiant connecté
app.get("/api/offres/:idOffre/candidature-statut", async (req, res) => {
  try {
    // Sécurité : on vérifie que l'utilisateur est connecté et qu'il s'agit bien d'un étudiant
    if (!req.session.userId || req.session.role !== "etudiant") {
      return res.status(401).json({ success: false, message: "Action non autorisée." });
    }

    const idEtudiant = req.session.userId;
    const idOffre = req.params.idOffre;

    // On cherche si l'étudiant a déjà postulé à cette offre
    const [rows] = await db.query(
      "SELECT date_candidature FROM postule WHERE id_etudiant = ? AND id_offre = ?",
      [idEtudiant, idOffre]
    );

    if (rows.length > 0) {
      // Si on trouve une correspondance, on renvoie la date de candidature
      return res.json({
        success: true,
        aPostule: true,
        date_candidature: rows[0].date_candidature
      });
    } else {
      // Sinon, il n'a pas encore postulé
      return res.json({
        success: true,
        aPostule: false
      });
    }

  } catch (error) {
    console.error("Erreur lors de la vérification de la candidature :", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
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
// ROUTE : POSTULER À UNE OFFRE (Avec Upload de CV et Lettre Texte/PDF)
// ==========================================================================
// On utilise .fields() au lieu de .single() pour accepter deux fichiers différents
app.post("/api/postuler", uploadCV.fields([{ name: 'cv', maxCount: 1 }, { name: 'lettre_fichier', maxCount: 1 }]), async (req, res) => {
  try {
    // 1. Vérifions si l'étudiant est bien connecté
    if (req.session.role !== "etudiant" || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Vous devez être connecté pour postuler.",
      });
    }

    // 2. On récupère TOUTES les infos du formulaire
    const { idOffre, type_lettre, lettre_motivation } = req.body;
    const idEtudiant = req.session.userId;
    const dateCandidature = new Date().toISOString().split("T")[0];

    // 3. On récupère le nom du CV sauvegardé par Multer
    // Attention : avec .fields(), req.file devient req.files (avec un "s")
    const nomFichierCV = (req.files && req.files['cv']) ? req.files['cv'][0].filename : null;

    if (!nomFichierCV) {
      return res
        .status(400)
        .json({ success: false, message: "Le CV est obligatoire." });
    }

    // 4. GESTION DE LA LETTRE (Fichier ou Texte)
    let contenuLettre = "";
    if (type_lettre === "fichier" && req.files && req.files['lettre_fichier']) {
      // Si l'étudiant a choisi "fichier" et qu'un fichier a bien été uploadé
      contenuLettre = req.files['lettre_fichier'][0].filename;
    } else {
      // Sinon, on prend le texte qu'il a tapé dans le textarea
      contenuLettre = lettre_motivation;
    }

    // 5. ON INSERE DANS LA BDD (avec le cv_fichier ET la lettre finale)
    await db.query(
      "INSERT INTO postule (id_etudiant, id_offre, date_candidature, statut, cv_fichier, lettre_motivation) VALUES (?, ?, ?, 'En attente', ?, ?)",
      [idEtudiant, idOffre, dateCandidature, nomFichierCV, contenuLettre],
    );

    res.json({ success: true, message: "Candidature envoyée avec succès !" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Vous avez déjà postulé à cette offre !",
      });
    }
    // C'EST ICI QUE L'ERREUR 500 S'AFFICHE DANS TON TERMINAL
    console.error("Erreur candidature :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ===========================================================================
// ROUTE : AJOUTER UNE OFFRE DE STAGE (Entreprise)
// ==========================================================================
app.post("/api/ajouter-offre", async (req, res) => {
  try {
    // Sécurité : on vérifie que c'est bien une entreprise connectée
    if (req.session.role !== "entreprise" || !req.session.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Vous n'êtes pas connecté." });
    }

    // J'ai mis date_publication (qui prend CURDATE()) à la fin pour que ça matche tes valeurs
    const query = `
      INSERT INTO offre 
      (id_entreprise, titre_offre, mission, date_debut, date_fin, tuteur_nom, date_publication, statut) 
      VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'active')
    `;

    await db.query(query, [
      req.session.userId,
      req.body.titre,
      req.body.mission,
      req.body.dateDebut,
      req.body.dateFin,
      req.body.tuteur,
    ]);

    res.json({ success: true, message: "Offre publiée avec succès !" });
  } catch (error) {
    console.error("Erreur ajout offre :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ===========================================================================
// ROUTE : RÉCUPÉRER LES OFFRES DE L'ENTREPRISE (Dashboard)
// ==========================================================================
app.get("/api/mes-offres", async (req, res) => {
  try {
    // On vérifie que c'est bien une entreprise
    if (req.session.role !== "entreprise" || !req.session.userId) {
      return res.status(401).json({ success: false, message: "Non autorisé" });
    }

    // Requête SQL : On récupère les offres ET on compte les candidatures
    const query = `
      SELECT o.*, COUNT(p.id_etudiant) AS nb_candidats
      FROM offre o
      LEFT JOIN postule p ON o.id_offre = p.id_offre
      WHERE o.id_entreprise = ?
      GROUP BY o.id_offre
      ORDER BY o.date_publication DESC
    `;

    const [offres] = await db.query(query, [req.session.userId]);

    res.json({ success: true, data: offres });
  } catch (error) {
    console.error("Erreur récupération du dashboard entreprise :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ===========================================================================
// ROUTE : MODIFIER UNE OFFRE (Entreprise)
// ==========================================================================
app.put("/api/offre/:id", async (req, res) => {
  try {
    if (req.session.role !== "entreprise" || !req.session.userId) {
      return res.status(401).json({ success: false });
    }

    const idOffre = req.params.id;
    const { titre, dateDebut, dateFin, tuteur, mission, statut } = req.body;

    // 1. On met à jour les informations de l'offre
    await db.query(
      "UPDATE offre SET titre_offre=?, date_debut=?, date_fin=?, tuteur_nom=?, mission=?, statut=? WHERE id_offre=? AND id_entreprise=?",
      [
        titre,
        dateDebut,
        dateFin,
        tuteur,
        mission,
        statut,
        idOffre,
        req.session.userId,
      ],
    );

    // 2. LA NOUVEAUTÉ EST ICI : Si l'entreprise passe l'offre en "inactive"
    if (statut === "inactive") {
      // On met à jour la table "postule" pour cette offre.
      // On passe tout le monde en "Refusé", SAUF ceux qui ont déjà le statut "Accepté"
      await db.query(
        "UPDATE postule SET statut = 'Refusé' WHERE id_offre = ? AND statut != 'Accepté'",
        [idOffre],
      );
    }

    res.json({ success: true, message: "Offre mise à jour !" });
  } catch (error) {
    console.error("Erreur modification offre :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ===========================================================================
// ROUTE : MODIFIER UNE OFFRE (Entreprise) - Version Haute Sécurité
// ==========================================================================
app.put("/api/offre/:id", async (req, res) => {
  try {
    // 1. Vérification de la session
    if (req.session.role !== "entreprise" || !req.session.userId) {
      return res.status(401).json({ success: false, message: "Non autorisé." });
    }

    const idOffre = req.params.id;
    const idEntreprise = req.session.userId;
    const { titre, dateDebut, dateFin, tuteur, mission, statut } = req.body;

    // 2. SÉCURITÉ ANTI-TRICHE : On récupère l'état actuel de l'offre en BDD
    const [offreActuelleRows] = await db.query(
      "SELECT statut FROM offre WHERE id_offre = ? AND id_entreprise = ?",
      [idOffre, idEntreprise],
    );

    // Si l'offre n'existe pas ou n'appartient pas à cette entreprise
    if (offreActuelleRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Offre introuvable ou accès refusé.",
      });
    }

    const offreActuelle = offreActuelleRows[0];

    // 3. Vérification du blocage par l'admin
    if (offreActuelle.statut === "bloquée") {
      return res.status(403).json({
        success: false,
        message:
          "Action refusée : Cette offre a été bloquée par la modération. Vous ne pouvez plus la modifier.",
      });
    }

    // 4. Empêcher l'entreprise de s'auto-bloquer en manipulant le code HTML/JS
    let nouveauStatut = statut;
    if (nouveauStatut === "bloquée") {
      nouveauStatut = offreActuelle.statut; // On annule sa tentative et on garde l'ancien statut
    }

    // 5. Mise à jour des informations de l'offre
    await db.query(
      "UPDATE offre SET titre_offre=?, date_debut=?, date_fin=?, tuteur_nom=?, mission=?, statut=? WHERE id_offre=? AND id_entreprise=?",
      [
        titre,
        dateDebut,
        dateFin,
        tuteur,
        mission,
        nouveauStatut,
        idOffre,
        idEntreprise,
      ],
    );

    // 6. LOGIQUE MÉTIER : Si l'entreprise passe l'offre en "inactive"
    // On refuse automatiquement les étudiants en attente, sauf ceux déjà acceptés
    if (nouveauStatut === "inactive" && offreActuelle.statut !== "inactive") {
      await db.query(
        "UPDATE postule SET statut = 'Refusé' WHERE id_offre = ? AND statut != 'Accepté'",
        [idOffre],
      );
    }

    res.json({ success: true, message: "Offre mise à jour avec succès !" });
  } catch (error) {
    console.error("Erreur modification offre :", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur interne." });
  }
});

// ===========================================================================
// ROUTE : RÉCUPÉRER LES CANDIDATURES D'UNE OFFRE
// ==========================================================================
app.get("/api/offre/:id/candidatures", async (req, res) => {
  try {
    if (req.session.role !== "entreprise" || !req.session.userId)
      return res.status(401).json({ success: false });

    const idOffre = req.params.id;

    // 1. On récupère les infos de l'offre (pour le titre) et on vérifie qu'elle appartient bien à l'entreprise
    const [offre] = await db.query(
      "SELECT * FROM offre WHERE id_offre = ? AND id_entreprise = ?",
      [idOffre, req.session.userId],
    );
    if (offre.length === 0)
      return res.status(403).json({ success: false, message: "Accès refusé" });

    // 2. On récupère les candidats (Jointure entre postule et etudiant)
    const query = `
      SELECT p.*, e.nom_etudiant, e.prenom_etudiant, e.email_etudiant, e.formation_etudiant
      FROM postule p
      JOIN etudiant e ON p.id_etudiant = e.id_etudiant
      WHERE p.id_offre = ?
      ORDER BY p.date_candidature DESC
    `;
    const [candidatures] = await db.query(query, [idOffre]);

    res.json({ success: true, offre: offre[0], candidatures });
  } catch (error) {
    console.error("Erreur récupération candidatures :", error);
    res.status(500).json({ success: false });
  }
});

// ===========================================================================
// ROUTE : ACCEPTER OU REFUSER UN CANDIDAT
// ==========================================================================
app.put("/api/candidature/:idOffre/:idEtudiant", async (req, res) => {
  try {
    if (req.session.role !== "entreprise" || !req.session.userId)
      return res.status(401).json({ success: false });

    const { idOffre, idEtudiant } = req.params;
    const { statut } = req.body; // 'Accepté' ou 'Refusé'

    // 1. On met à jour le statut dans la table postule
    await db.query(
      "UPDATE postule SET statut = ? WHERE id_offre = ? AND id_etudiant = ?",
      [statut, idOffre, idEtudiant],
    );

    // 2. Si l'étudiant est accepté, on l'assigne officiellement à l'offre !
    if (statut === "Accepté") {
      await db.query("UPDATE offre SET id_etudiant = ? WHERE id_offre = ?", [
        idEtudiant,
        idOffre,
      ]);
    }

    res.json({ success: true, message: `Candidature passée en : ${statut}` });
  } catch (error) {
    console.error("Erreur MAJ statut :", error);
    res.status(500).json({ success: false });
  }
});

// ===========================================================================
// ROUTE : STATISTIQUES DU DASHBOARD ENTREPRISE
// ==========================================================================
app.get("/api/entreprise/stats", async (req, res) => {
  try {
    if (req.session.role !== "entreprise" || !req.session.userId) {
      return res.status(401).json({ success: false });
    }

    const idEntreprise = req.session.userId;

    // 1. Compter les offres actives
    const [[{ total_actives }]] = await db.query(
      "SELECT COUNT(*) AS total_actives FROM offre WHERE id_entreprise = ? AND statut = 'active'",
      [idEntreprise],
    );

    // 2. Compter TOUTES les candidatures reçues par cette entreprise (Jointure)
    const [[{ total_candidatures }]] = await db.query(
      "SELECT COUNT(p.id_etudiant) AS total_candidatures FROM postule p JOIN offre o ON p.id_offre = o.id_offre WHERE o.id_entreprise = ?",
      [idEntreprise],
    );

    res.json({
      success: true,
      stats: {
        actives: total_actives,
        candidatures: total_candidatures,
      },
    });
  } catch (error) {
    console.error("Erreur stats entreprise :", error);
    res.status(500).json({ success: false });
  }
});

// ===========================================================================
// ROUTE : SIGNALER UNE OFFRE
// ==========================================================================
app.post("/api/signaler-offre", async (req, res) => {
  try {
    // Il faut être connecté pour signaler (pour éviter le spam)
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Vous devez être connecté pour signaler une offre.",
      });
    }

    const { idOffre, motif, description } = req.body;
    const dateSignalement = new Date().toISOString().split("T")[0];

    await db.query(
      "INSERT INTO signalement (id_offre, id_utilisateur, motif, description, date_signalement) VALUES (?, ?, ?, ?, ?)",
      [idOffre, req.session.userId, motif, description, dateSignalement],
    );

    res.json({
      success: true,
      message: "Merci, votre signalement a été pris en compte.",
    });
  } catch (error) {
    console.error("Erreur lors du signalement :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ===========================================================================
// ROUTE : STATISTIQUES DU DASHBOARD ADMIN
// ==========================================================================
app.get("/api/admin/stats", async (req, res) => {
  try {
    // Sécurité : On vérifie que c'est bien un administrateur connecté
    if (req.session.role !== "admin" || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Accès refusé. Réservé aux administrateurs.",
      });
    }

    // 1. Compter tous les étudiants
    const [[{ total_etudiants }]] = await db.query(
      "SELECT COUNT(*) AS total_etudiants FROM etudiant",
    );

    // 2. Compter toutes les entreprises
    const [[{ total_entreprises }]] = await db.query(
      "SELECT COUNT(*) AS total_entreprises FROM entreprise",
    );

    // 3. Compter les offres actives (en ligne)
    const [[{ total_offres }]] = await db.query(
      "SELECT COUNT(*) AS total_offres FROM offre WHERE statut = 'active'",
    );

    // 4. Compter les signalements à traiter (En attente)
    const [[{ total_signalements }]] = await db.query(
      "SELECT COUNT(*) AS total_signalements FROM signalement WHERE statut = 'En attente'",
    );

    res.json({
      success: true,
      stats: {
        etudiants: total_etudiants,
        entreprises: total_entreprises,
        offres: total_offres,
        signalements: total_signalements,
      },
    });
  } catch (error) {
    console.error("Erreur stats admin :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ===========================================================================
// ROUTES ADMIN : GESTION DES UTILISATEURS
// ==========================================================================

// Récupérer tous les utilisateurs (Étudiants + Entreprises) et vérifier s'ils sont bannis
app.get("/api/admin/utilisateurs", async (req, res) => {
  try {
    if (req.session.role !== "admin")
      return res.status(401).json({ success: false });

    // 1. Récupération des étudiants
    const [etudiants] = await db.query(`
      SELECT id_etudiant AS id, 'etudiant' AS type, nom_etudiant AS nom, prenom_etudiant AS prenom, email_etudiant AS email, formation_etudiant AS detail_formation, NULL AS detail_contact 
      FROM etudiant
    `);

    // 2. Récupération des entreprises
    const [entreprises] = await db.query(`
      SELECT id_entreprise AS id, 'entreprise' AS type, nom_entreprise AS nom, NULL AS prenom, email_entreprise AS email, NULL AS detail_formation, nom_contact AS detail_contact 
      FROM entreprise
    `);

    // 3. Récupération des bannissements actifs
    const [bans] = await db.query(
      "SELECT id_etudiant, id_entreprise FROM bannissement",
    );

    // 4. Fusion et ajout du statut (Actif ou Banni)
    const utilisateurs = [...etudiants, ...entreprises].map((u) => {
      // On regarde si l'ID de cet utilisateur est dans la table bannissement
      const isBanni =
        u.type === "etudiant"
          ? bans.some((b) => b.id_etudiant === u.id)
          : bans.some((b) => b.id_entreprise === u.id);

      return { ...u, statut: isBanni ? "Banni" : "Actif" };
    });

    res.json({ success: true, utilisateurs });
  } catch (error) {
    console.error("Erreur récupération utilisateurs :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Bannir un utilisateur
app.post("/api/admin/ban", async (req, res) => {
  try {
    if (req.session.role !== "admin")
      return res.status(401).json({ success: false });

    const { id, type, motif } = req.body;
    const idAdmin = req.session.userId; // L'admin qui exécute la sanction

    if (type === "etudiant") {
      await db.query(
        "INSERT INTO bannissement (id_admin, id_etudiant, motif) VALUES (?, ?, ?)",
        [idAdmin, id, motif],
      );
    } else {
      await db.query(
        "INSERT INTO bannissement (id_admin, id_entreprise, motif) VALUES (?, ?, ?)",
        [idAdmin, id, motif],
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors du bannissement :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Débannir un utilisateur (Supprimer la ligne de la table bannissement)
app.delete("/api/admin/ban/:type/:id", async (req, res) => {
  try {
    if (req.session.role !== "admin")
      return res.status(401).json({ success: false });

    const { type, id } = req.params;
    if (type === "etudiant") {
      await db.query("DELETE FROM bannissement WHERE id_etudiant = ?", [id]);
    } else {
      await db.query("DELETE FROM bannissement WHERE id_entreprise = ?", [id]);
    }
    res.json({ success: true, message: "Utilisateur débanni." });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// ===========================================================================
// ROUTES ADMIN : MODÉRATION DES OFFRES
// ==========================================================================

// Récupérer toutes les offres avec le décompte des signalements
app.get("/api/admin/offres", async (req, res) => {
  try {
    if (req.session.role !== "admin")
      return res.status(401).json({ success: false });

    const query = `
      SELECT o.*, e.nom_entreprise, COUNT(s.id_signalement) AS nb_signalements
      FROM offre o
      JOIN entreprise e ON o.id_entreprise = e.id_entreprise
      LEFT JOIN signalement s ON o.id_offre = s.id_offre
      GROUP BY o.id_offre
      ORDER BY nb_signalements DESC, o.date_publication DESC
    `;

    const [offres] = await db.query(query);
    res.json({ success: true, offres });
  } catch (error) {
    console.error("Erreur récupération offres admin :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Bloquer une offre
app.put("/api/admin/offre/:id/block", async (req, res) => {
  try {
    if (req.session.role !== "admin")
      return res.status(401).json({ success: false });

    // On passe l'offre en "bloquée".
    // Si tu avais ajouté la colonne motif_blocage, on l'ajouterait ici !
    await db.query("UPDATE offre SET statut = 'bloquée' WHERE id_offre = ?", [
      req.params.id,
    ]);

    res.json({ success: true, message: "Offre bloquée." });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Débloquer une offre
app.put("/api/admin/offre/:id/unblock", async (req, res) => {
  try {
    if (req.session.role !== "admin")
      return res.status(401).json({ success: false });

    await db.query("UPDATE offre SET statut = 'active' WHERE id_offre = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Offre débloquée." });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// ===========================================================================
// ROUTE ADMIN : VOIR LES SIGNALEMENTS D'UNE OFFRE
// ==========================================================================
app.get("/api/admin/offre/:id/signalements", async (req, res) => {
  try {
    if (req.session.role !== "admin")
      return res.status(401).json({ success: false });

    // On fait une jointure pour récupérer le nom de l'étudiant qui a signalé
    const query = `
      SELECT s.*, e.nom_etudiant, e.prenom_etudiant
      FROM signalement s
      JOIN etudiant e ON s.id_utilisateur = e.id_etudiant
      WHERE s.id_offre = ?
      ORDER BY s.date_signalement DESC
    `;

    const [signalements] = await db.query(query, [req.params.id]);
    res.json({ success: true, signalements });
  } catch (error) {
    console.error("Erreur récupération signalements :", error);
    res.status(500).json({ success: false });
  }
});

// ===========================================================================
// ROUTE ADMIN : HISTORIQUE DES BANNISSEMENTS
// ==========================================================================
app.get("/api/admin/historique-bans", async (req, res) => {
  try {
    if (req.session.role !== "admin")
      return res.status(401).json({ success: false });

    // La magie du UNION : on combine deux requêtes différentes en un seul résultat !
    const query = `
      SELECT 
        b.id_ban, b.date_bannissement, b.motif, b.date_fin,
        'etudiant' AS type, e.id_etudiant AS id_utilisateur, 
        e.nom_etudiant AS nom, e.prenom_etudiant AS prenom, e.email_etudiant AS email
      FROM bannissement b
      JOIN etudiant e ON b.id_etudiant = e.id_etudiant
      
      UNION
      
      SELECT 
        b.id_ban, b.date_bannissement, b.motif, b.date_fin,
        'entreprise' AS type, ent.id_entreprise AS id_utilisateur, 
        ent.nom_entreprise AS nom, NULL AS prenom, ent.email_entreprise AS email
      FROM bannissement b
      JOIN entreprise ent ON b.id_entreprise = ent.id_entreprise
      
      ORDER BY date_bannissement DESC
    `;

    const [historique] = await db.query(query);
    res.json({ success: true, historique });
  } catch (error) {
    console.error("Erreur historique bans :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ===========================================================================
// ROUTE : ANNULER UNE CANDIDATURE (ÉTUDIANT)
// ==========================================================================
app.delete("/api/annuler-candidature/:idOffre", async (req, res) => {
  try {
    // 1. Vérification de la session
    if (!req.session.userId || req.session.role !== "etudiant") {
      return res.status(401).json({ success: false, message: "Non autorisé." });
    }

    const idEtudiant = req.session.userId;
    const idOffre = req.params.idOffre;

    // 2. On vérifie le statut actuel de la candidature
    const [candidature] = await db.query(
      "SELECT statut FROM postule WHERE id_etudiant = ? AND id_offre = ?",
      [idEtudiant, idOffre]
    );

    if (candidature.length === 0) {
      return res.status(404).json({ success: false, message: "Candidature introuvable." });
    }

    // 3. LA SÉCURITÉ : On bloque si ce n'est plus "En attente"
    if (candidature[0].statut !== "En attente") {
      return res.status(403).json({
        success: false,
        message: `Impossible d'annuler. Cette candidature est déjà ${candidature[0].statut.toLowerCase()}.`
      });
    }

    // 4. Si c'est toujours "En attente", on supprime la candidature
    await db.query(
      "DELETE FROM postule WHERE id_etudiant = ? AND id_offre = ?",
      [idEtudiant, idOffre]
    );

    res.json({ success: true, message: "Candidature annulée avec succès." });

  } catch (error) {
    console.error("Erreur lors de l'annulation :", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});