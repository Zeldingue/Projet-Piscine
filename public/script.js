/* ==========================================================================
   GESTION DE LA CHARTE GRAPHIQUE (Couleurs de la Navbar)
   ========================================================================== */
function setCharteGraphique(role) {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  // On nettoie les anciennes classes
  navbar.classList.remove(
    "navbar-etudiant",
    "navbar-entreprise",
    "navbar-admin",
  );

  // On applique la nouvelle selon le rôle
  if (role === "entreprise") {
    navbar.classList.add("navbar-entreprise");
  } else if (role === "admin") {
    navbar.classList.add("navbar-admin");
  } else {
    navbar.classList.add("navbar-etudiant");
  }
}

/* ==========================================================================
   GESTION DYNAMIQUE DU HEADER ET FOOTER SELON LA SESSION
   ========================================================================== */
async function chargerMenuDynamique() {
  try {
    const response = await fetch("/api/session");
    const session = await response.json();

    // =========================================================
    // 1. GESTION DU HEADER (NAVBAR)
    // =========================================================
    const navLinks = document.querySelector(".nav-links");
    const btnAccount = document.querySelector(".btn-account");

    if (navLinks && btnAccount) {
      if (session.isConnected) {
        if (session.role === "etudiant") {
          navLinks.innerHTML = `
            <li><a href="/recherche.html">Recherche d'Offres</a></li>
            <li><a href="/etudiant/etudiant-candidatures.html">Mes Candidatures</a></li>
            <li><a href="/etudiant/etudiant-carnet.html">Carnet de stages</a></li>
          `;
          btnAccount.innerHTML = `${session.nom} <i class="fa-solid fa-user"></i>`;
          btnAccount.href = "/etudiant/etudiant-profil.html";
        } else if (session.role === "entreprise") {
          navLinks.innerHTML = `
            <li><a href="/recherche.html">Rechercher un stage</a></li>
            <li><a href="/entreprise/entreprise-dashboard.html">Tableau de bord</a></li>
            <li><a href="/entreprise/entreprise-candidatures.html">Candidats</a></li>
            <li><a href="/entreprise/entreprise-nouvelle-offre.html">Publier une offre</a></li>
          `;
          btnAccount.innerHTML = `${session.nom} <i class="fa-solid fa-building"></i>`;
          btnAccount.href = "/entreprise/entreprise-profil.html";
        } else if (session.role === "admin") {
          // NAVBAR ADMIN (Avec Recherche d'offres)
          navLinks.innerHTML = `
            <li><a href="/admin/admin-dashboard.html">Tableau de bord</a></li>
            <li><a href="/recherche.html">Recherche d'Offres</a></li>
                <li><a href="/admin/admin-utilisateurs.html">Gestion des utilisateurs</a></li>
                <li><a href="/admin/admin-offres.html">Offres signalées</a></li>
          `;
          btnAccount.innerHTML = `${session.nom} <i class="fa-solid fa-shield-halved"></i>`;
          btnAccount.href = "/admin/admin-profil.html";
        }

        if (typeof setCharteGraphique === "function") {
          setCharteGraphique(session.role);
        }
      } else {
        // VISITEUR
        navLinks.innerHTML = `
          <li><a href="/index.html">Accueil</a></li>
          <li><a href="/recherche.html">Recherche d'Offres</a></li>
        `;
        btnAccount.innerHTML = `Se connecter <i class="fa-solid fa-arrow-right"></i>`;
        btnAccount.href = "/connexion.html";

        if (typeof setCharteGraphique === "function") {
          setCharteGraphique("visiteur");
        }
      }

      // Ajout de la classe "active"
      const currentPath = window.location.pathname;
      const tousLesLiens = navLinks.querySelectorAll("a");
      tousLesLiens.forEach((lien) => {
        if (lien.getAttribute("href") === currentPath) {
          lien.classList.add("active");
        }
      });
    }

    // =========================================================
    // 2. GESTION DU FOOTER
    // =========================================================
    const footerElement = document.getElementById("footer-dynamique");

    if (footerElement) {
      // ---------------------------------------------------------
      // SI C'EST UN ADMIN (Structure spécifique)
      // ---------------------------------------------------------
      if (session.isConnected && session.role === "admin") {
        footerElement.className = "site-footer-admin";
        footerElement.innerHTML = `
          <div class="footer-content">
            <div class="footer-col brand-col">
              <div class="footer-logo"><i class="fa-solid fa-shield-halved"></i> StageFlow ADMIN</div>
              <p>Interface de supervision et de modération de la plateforme StageFlow.</p>
            </div>
            
            <div class="footer-col">
              <h4>Modération</h4>
              <ul>
                <li><a href="/admin/admin-utilisateurs.html">Gestion des utilisateurs</a></li>
                <li><a href="/admin/admin-offres.html">Offres signalées</a></li>
                <li><a href="/admin/historique-bans.html">Historique des bannissements</a></li>
              </ul>
            </div>
            
            <div class="footer-col">
              <h4>Système</h4>
              <ul>
                <li><a href="/admin/logs.html">Logs de connexion</a></li>
                <li><a href="/admin/export.html">Base de données (Export)</a></li>
                <li><a href="/admin/securite.html">Paramètres de sécurité</a></li>
              </ul>
            </div>
          </div>
          
          <div class="footer-bottom">
            © 2026 StageFlow - Accès Restreint. <span style="color: #ff4d4d;">Toutes les actions sont tracées.</span>
          </div>
        `;
      }
      // ---------------------------------------------------------
      // SI C'EST UN ÉTUDIANT, ENTREPRISE OU VISITEUR
      // ---------------------------------------------------------
      else {
        let liensRapides = "";
        let footerClass = "site-footer-etudiant";

        if (session.isConnected) {
          if (session.role === "etudiant") {
            footerClass = "site-footer-etudiant";
            liensRapides = `
              <li><a href="/recherche.html">Rechercher un stage</a></li>
              <li><a href="/etudiant/etudiant-dashboard.html">Mes candidatures</a></li>
              <li><a href="/etudiant/etudiant-carnet.html">Mon carnet de stage</a></li>
              <li><a href="/etudiant/etudiant-profil.html">Mon Profil</a></li>
            `;
          } else if (session.role === "entreprise") {
            footerClass = "site-footer-entreprise";
            liensRapides = `
              <li><a href="/recherche.html">Rechercher un stage</a></li>
              <li><a href="/entreprise/entreprise-dashboard.html">Tableau de bord</a></li>
              <li><a href="/entreprise/entreprise-nouvelle-offre.html">Publier une offre</a></li>
              <li><a href="/entreprise/entreprise-candidatures.html">Gérer les candidats</a></li>
              <li><a href="/entreprise/entreprise-profil.html">Profil Entreprise</a></li>
            `;
          }
        } else {
          liensRapides = `
            <li><a href="/index.html">Accueil</a></li>
            <li><a href="/recherche.html">Voir les offres</a></li>
            <li><a href="/connexion.html">Se connecter</a></li>
            <li><a href="/register.html">Créer un compte</a></li>
          `;
        }

        footerElement.className = footerClass;
        footerElement.innerHTML = `
          <div class="footer-content">
            <div class="footer-col brand-col">
              <div class="footer-logo">StageFlow</div>
              <p>La plateforme qui connecte les étudiants du BTS SIO avec les meilleures entreprises tech.</p>
            </div>
            <div class="footer-col">
              <h4>Liens Rapides</h4>
              <ul>${liensRapides}</ul>
            </div>
            <div class="footer-col">
              <h4>Contact & Aide</h4>
              <ul>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Support technique</a></li>
                <li><a href="#">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            &copy; 2026 StageFlow. Tous droits réservés.
          </div>
        `;
      }
    }
  } catch (error) {
    console.error("Erreur lors du chargement du menu et du footer :", error);
  }
}

// On exécute la fonction UNE SEULE FOIS au chargement de la page
document.addEventListener("DOMContentLoaded", chargerMenuDynamique);

/* ==========================================================================
   AUTRES FONCTIONS (Modales, Uploads, Formulaires)
   ========================================================================== */
function switchRegRole(role) {
  document.getElementById("btn-reg-etudiant").classList.remove("active");
  document.getElementById("btn-reg-entreprise").classList.remove("active");
  document.getElementById("btn-reg-" + role).classList.add("active");

  document.getElementById("form-reg-etudiant").classList.remove("active");
  document.getElementById("form-reg-entreprise").classList.remove("active");
  document.getElementById("form-reg-" + role).classList.add("active");
}

// 1. Ouvrir la modale
function ouvrirModal() {
  // On récupère l'ID dans l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const idOffre = urlParams.get("id");

  console.log("ID de l'offre trouvé dans l'URL :", idOffre); // Regarde dans la console (F12) si ça affiche bien un chiffre !

  if (!idOffre || idOffre === "") {
    alert(
      "⚠️ Erreur : Impossible de trouver l'offre. Êtes-vous bien passé par la page de recherche ? (Il manque le ?id=... dans l'URL)",
    );
    return; // On bloque l'ouverture de la modale !
  }

  // On met l'ID dans le champ caché
  document.getElementById("candidature-id-offre").value = idOffre;

  // On affiche la modale
  const modal = document.getElementById("modal-postuler");
  if (modal) modal.style.display = "flex";
}
function fermerModal() {
  document.getElementById("modal-postuler").classList.remove("active");
  document.body.style.overflow = "auto";
}

function updateFileName(input) {
  const textSpan = document.getElementById("upload-text");
  const dropZone = document.getElementById("upload-zone");
  const icon = document.getElementById("upload-icon");

  const allowedExtensions = [".pdf", ".doc", ".docx", ".txt"];

  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    const fileName = file.name;
    const fileExtension = fileName
      .substring(fileName.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      alert(
        "Format non autorisé. Veuillez choisir un fichier .pdf, .doc, .docx ou .txt.",
      );
      input.value = "";
      textSpan.textContent = "Cliquez pour ajouter votre CV";
      textSpan.style.color = "#dc3545";
      dropZone.classList.remove("has-file");
      icon.classList.remove("fa-file-pdf");
      icon.classList.add("fa-cloud-arrow-up");
      icon.style.color = "#dc3545";
      return;
    }

    textSpan.textContent = fileName;
    textSpan.style.color = "#586B33";
    dropZone.classList.add("has-file");

    icon.classList.remove("fa-cloud-arrow-up");
    if (fileExtension === ".pdf") {
      icon.classList.add("fa-file-pdf");
    } else if (fileExtension === ".txt") {
      icon.classList.add("fa-file-lines");
    } else {
      icon.classList.add("fa-file-word");
    }
    icon.style.color = "#586B33";
  } else {
    textSpan.textContent = "Cliquez pour ajouter votre CV";
    textSpan.style.color = "#333";
    dropZone.classList.remove("has-file");
    icon.classList.remove("fa-file-pdf", "fa-file-word", "fa-file-lines");
    icon.classList.add("fa-cloud-arrow-up");
    icon.style.color = "#586B33";
  }
}

// Ouvre la modale pour un NOUVEAU stage
function ouvrirModalStage() {
  document.getElementById("edit-id-stage").value = ""; // TRÈS IMPORTANT : On vide l'ID caché !
  document.getElementById("titre-modal-stage").textContent =
    "Ajouter une expérience";
  document.getElementById("btn-submit-stage").textContent =
    "Enregistrer le stage";

  const form = document.getElementById("form-ajouter-stage");
  if (form) form.reset(); // On vide toutes les cases

  toggleAutreEntreprise(); // On reset l'affichage du champ "autre"

  // On vide les messages d'erreur précédents s'il y en a
  const msg = document.getElementById("msg-ajout");
  if (msg) msg.textContent = "";

  const modal = document.getElementById("modal-ajouter-stage");
  if (modal) modal.style.display = "flex";
}

function fermerModalStage() {
  const modal = document.getElementById("modal-ajouter-stage");
  if (modal) {
    modal.style.display = "none";
  }
  // On reset le formulaire pour que la prochaine ouverture soit propre
  const form = document.getElementById("form-ajouter-stage");
  if (form) form.reset();

  // On vide le message d'erreur/succès
  const msg = document.getElementById("msg-ajout");
  if (msg) msg.textContent = "";
}

function updateDocName(input) {
  const textSpan = document.getElementById("upload-text-doc");
  const dropZone = document.getElementById("upload-zone-doc");
  const icon = document.getElementById("upload-icon-doc");

  const allowedExtensions = [".pdf", ".doc", ".docx"];

  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    const fileName = file.name;
    const fileExtension = fileName
      .substring(fileName.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      alert(
        "Format non autorisé. Veuillez choisir un fichier .pdf, .doc ou .docx.",
      );
      input.value = "";
      textSpan.textContent = "Cliquez pour joindre un document";
      textSpan.style.color = "#dc3545";
      dropZone.classList.remove("has-file");
      icon.classList.remove("fa-file-pdf", "fa-file-word");
      icon.classList.add("fa-cloud-arrow-up");
      icon.style.color = "#dc3545";
      return;
    }

    textSpan.textContent = fileName;
    textSpan.style.color = "#586B33";
    dropZone.classList.add("has-file");

    icon.classList.remove("fa-cloud-arrow-up");
    if (fileExtension === ".pdf") {
      icon.classList.add("fa-file-pdf");
    } else {
      icon.classList.add("fa-file-word");
    }
    icon.style.color = "#586B33";
  } else {
    textSpan.textContent = "Cliquez pour joindre un document";
    textSpan.style.color = "#333";
    dropZone.classList.remove("has-file");
    icon.classList.remove("fa-file-pdf", "fa-file-word");
    icon.classList.add("fa-cloud-arrow-up");
    icon.style.color = "#586B33";
  }
}

/* ==========================================================================
   CHARGEMENT DYNAMIQUE DES OFFRES DE STAGE (Page Recherche)
   ========================================================================== */
async function chargerOffres() {
  const cardsGrid = document.querySelector(".cards-grid");

  if (!cardsGrid) return;

  try {
    const response = await fetch("/api/offres");
    const data = await response.json();

    if (data.success) {
      cardsGrid.innerHTML = "";

      if (data.offres.length === 0) {
        cardsGrid.innerHTML =
          '<p style="grid-column: span 2; text-align: center;">Aucune offre de stage n\'est disponible pour le moment.</p>';
        return;
      }

      data.offres.forEach((offre) => {
        // Formatage des dates
        const dateDebut = new Date(offre.date_debut).toLocaleDateString(
          "fr-FR",
        );
        const dateFin = new Date(offre.date_fin).toLocaleDateString("fr-FR");

        // On raccourcit la mission pour que la carte ne soit pas trop géante
        const missionCourte =
          offre.mission.length > 80
            ? offre.mission.substring(0, 80) + "..."
            : offre.mission;

        const carteHTML = `
          <div class="job-card">
            <div class="job-company">${offre.nom_entreprise}</div>
            
            <h3 class="job-title">${offre.titre_offre}</h3>
            
            <p class="job-details">
              <i class="fa-regular fa-calendar" style="color: #586b33;"></i> Du ${dateDebut} au ${dateFin} <br>
              <i class="fa-solid fa-bullseye" style="color: #586b33; margin-top: 0.5rem;"></i> ${missionCourte}
            </p>
            
            <a href="/offre-details.html?id=${offre.id_offre}" class="btn-view-offer">Voir l'offre en détail</a>
          </div>
        `;

        cardsGrid.innerHTML += carteHTML;
      });
    }
  } catch (error) {
    console.error("Impossible de charger les offres :", error);
    cardsGrid.innerHTML =
      '<p style="color: red;">Erreur lors du chargement des offres.</p>';
  }
}
// On demande à exécuter cette fonction au chargement de la page
document.addEventListener("DOMContentLoaded", chargerOffres);

/* ==========================================================================
   CHARGEMENT D'UNE OFFRE DÉTAILLÉE (Page offre-details.html)
   ========================================================================== */
async function chargerDetailsOffre() {
  const container = document.getElementById("offre-container");
  const loading = document.getElementById("loading-message");

  if (!container || !loading) return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const idOffre = urlParams.get("id");

    if (!idOffre) {
      loading.innerHTML = "Aucun identifiant d'offre fourni.";
      return;
    }

    const response = await fetch(`/api/offres/${idOffre}`);
    const data = await response.json();

    if (data.success) {
      const offre = data.offre;

      const dateDebut = new Date(offre.date_debut).toLocaleDateString("fr-FR");
      const dateFin = new Date(offre.date_fin).toLocaleDateString("fr-FR");

      // On remplit le HTML
      document.getElementById("detail-titre").textContent = offre.titre_offre;
      document.getElementById("detail-entreprise").textContent =
        offre.nom_entreprise;
      document.getElementById("detail-ville").textContent =
        offre.ville || "Non spécifiée";
      document.getElementById("detail-dates").textContent =
        `${dateDebut} au ${dateFin}`;
      document.getElementById("detail-mission").textContent = offre.mission;
      document.getElementById("detail-tuteur").textContent = offre.tuteur_nom;

      const modalSubtitle = document.getElementById("modal-offre-titre");
      if (modalSubtitle) {
        modalSubtitle.textContent = `${offre.nom_entreprise} - ${offre.titre_offre}`;
      }

      // ==============================================================
      // GESTION DU BOUTON "POSTULER" SELON L'UTILISATEUR
      // ==============================================================
      const btnPostuler = document.querySelector(".btn-postuler");

      if (btnPostuler) {
        if (!data.role) {
          // Cas 1 : Visiteur non connecté
          btnPostuler.textContent = "Connectez-vous pour postuler";
          btnPostuler.style.backgroundColor = "#111"; // Noir au lieu de vert
          btnPostuler.onclick = () =>
            (window.location.href = "/connexion.html");
        } else if (data.role !== "etudiant") {
          // Cas 2 : Entreprise ou Admin
          btnPostuler.textContent = "Réservé aux étudiants";
          btnPostuler.style.backgroundColor = "#ccc";
          btnPostuler.style.cursor = "not-allowed";
          btnPostuler.onclick = null; // Désactive le clic
        } else if (data.hasApplied) {
          // Cas 3 : Étudiant qui a DÉJÀ postulé
          btnPostuler.innerHTML =
            '<i class="fa-solid fa-check"></i> Vous avez déjà postulé';
          btnPostuler.style.backgroundColor = "#888"; // Gris
          btnPostuler.style.cursor = "not-allowed";
          btnPostuler.onclick = null; // Désactive le clic
        } else {
          // Cas 4 : Étudiant qui n'a pas encore postulé
          btnPostuler.textContent = "Postuler maintenant";
          btnPostuler.style.backgroundColor = "#586b33";
          btnPostuler.style.cursor = "pointer";
          btnPostuler.onclick = ouvrirModal; // Ouvre la modale
        }
      }

      // On affiche le tout
      loading.style.display = "none";
      container.style.display = "flex";
    } else {
      loading.innerHTML = "Cette offre n'existe pas ou a été retirée.";
    }
  } catch (error) {
    console.error("Erreur :", error);
    loading.innerHTML = "Erreur lors du chargement de l'offre.";
  }
}
// On exécute la fonction au chargement de la page
document.addEventListener("DOMContentLoaded", chargerDetailsOffre);

/* ==========================================================================
   CHARGEMENT DU PROFIL (Universel : Étudiant, Entreprise, Admin)
   ========================================================================== */
async function chargerProfil() {
  const nomElement = document.getElementById("profil-nom");
  const prenomElement = document.getElementById("profil-prenom");
  const emailElement = document.getElementById("profil-email");
  const telephoneElement = document.getElementById("profil-telephone");

  // Nouveaux champs spécifiques à l'entreprise
  const siretElement = document.getElementById("profil-siret");
  const secteurElement = document.getElementById("profil-secteur");

  // Si on n'est pas sur une page qui contient les champs de base, on arrête
  if (!nomElement || !prenomElement || !emailElement) return;

  try {
    const response = await fetch("/api/profil");
    const data = await response.json();

    if (data.success) {
      const utilisateur = data.data;

      // Champs communs à tout le monde
      nomElement.value = utilisateur.nom || "";
      prenomElement.value = utilisateur.prenom || "";
      emailElement.value = utilisateur.email || "";

      if (telephoneElement) {
        telephoneElement.value = utilisateur.telephone || "";
      }

      // Champs spécifiques à l'entreprise (s'ils existent sur la page)
      if (siretElement && utilisateur.siret) {
        siretElement.value = utilisateur.siret;
      }

      if (secteurElement && utilisateur.secteur) {
        secteurElement.value = utilisateur.secteur;
      }
    } else {
      console.error("Erreur :", data.message);
    }
  } catch (error) {
    console.error("Erreur de fetch lors du chargement du profil :", error);
  }
}

/* ==========================================================================
   GESTION DU CHANGEMENT DE MOT DE PASSE
   ========================================================================== */
async function configurerChangementMdp() {
  const formMdp = document.getElementById("form-mdp");
  const msgMdp = document.getElementById("msg-mdp");

  // Si on n'est pas sur la page de profil, on arrête la fonction
  if (!formMdp) return;

  formMdp.addEventListener("submit", async (e) => {
    e.preventDefault(); // Empêche la page de se recharger brusquement

    const ancienMdp = document.getElementById("ancien-mdp").value;
    const nouveauMdp = document.getElementById("nouveau-mdp").value;
    const confirmMdp = document.getElementById("confirm-mdp").value;

    // Vérification rapide côté client
    if (nouveauMdp !== confirmMdp) {
      msgMdp.textContent =
        "❌ Les nouveaux mots de passe ne correspondent pas.";
      msgMdp.style.color = "red";
      return;
    }

    try {
      msgMdp.textContent = "⏳ Mise à jour en cours...";
      msgMdp.style.color = "#888";

      // On envoie les infos au serveur (methode POST)
      const response = await fetch("/api/mot-de-passe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ancienMdp: ancienMdp,
          nouveauMdp: nouveauMdp,
          confirmMdp: confirmMdp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        msgMdp.textContent = "✅ " + data.message;
        msgMdp.style.color = "green";
        formMdp.reset(); // Vide les champs du formulaire après succès
      } else {
        msgMdp.textContent = "❌ " + data.message;
        msgMdp.style.color = "red";
      }
    } catch (error) {
      console.error("Erreur Fetch:", error);
      msgMdp.textContent = "❌ Impossible de joindre le serveur.";
      msgMdp.style.color = "red";
    }
  });
}

/* ==========================================================================
   GESTION DE LA SAUVEGARDE DU PROFIL
   ========================================================================== */
async function configurerModificationProfil() {
  const formProfil = document.getElementById("form-profil");
  const msgProfil = document.getElementById("msg-profil");

  if (!formProfil) return;

  formProfil.addEventListener("submit", async (e) => {
    e.preventDefault();

    // On récupère les valeurs des champs (en utilisant le point d'interrogation
    // au cas où le champ n'existe pas pour ce rôle, ex: secteur pour un étudiant)
    const nom = document.getElementById("profil-nom")?.value;
    const prenom = document.getElementById("profil-prenom")?.value;
    const email = document.getElementById("profil-email")?.value;
    const telephone = document.getElementById("profil-telephone")?.value;
    const secteur = document.getElementById("profil-secteur")?.value;

    try {
      if (msgProfil) {
        msgProfil.textContent = "⏳ Sauvegarde en cours...";
        msgProfil.style.color = "#888";
      }

      // On utilise la méthode PUT (souvent utilisée pour la mise à jour)
      const response = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom,
          prenom: prenom,
          email: email,
          telephone: telephone,
          secteur: secteur,
        }),
      });

      const data = await response.json();

      if (msgProfil) {
        if (data.success) {
          msgProfil.textContent = "✅ " + data.message;
          msgProfil.style.color = "green";
        } else {
          msgProfil.textContent = "❌ " + data.message;
          msgProfil.style.color = "red";
        }
      }
    } catch (error) {
      console.error("Erreur Fetch:", error);
      if (msgProfil) {
        msgProfil.textContent = "❌ Impossible de joindre le serveur.";
        msgProfil.style.color = "red";
      }
    }
  });
}

/* ==========================================================================
   CHARGEMENT DU TABLEAU DES CANDIDATURES (Dashboard Étudiant)
   ========================================================================== */
async function chargerMesCandidatures() {
  const tbody = document.getElementById("candidatures-body");

  if (!tbody) return;

  try {
    const response = await fetch("/api/mes-candidatures");
    const data = await response.json();

    if (data.success) {
      tbody.innerHTML = ""; // On vide le message de chargement

      if (data.data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 2rem; color: #888;">
              Vous n'avez postulé à aucune offre pour le moment.
            </td>
          </tr>`;
        return;
      }

      data.data.forEach((candidature) => {
        // 1. Formatage de la date (ex: 15/04/2026)
        const dateCandidature = new Date(
          candidature.date_candidature,
        ).toLocaleDateString("fr-FR");

        // 2. Détermination de la couleur du badge de statut
        let classeStatut = "status attente"; // Par défaut (gris/orange)
        let texteStatut = candidature.statut || "En attente";

        const statutMin = texteStatut.toLowerCase();
        if (statutMin.includes("accept")) {
          classeStatut = "status accepte"; // Vert
        } else if (statutMin.includes("refus")) {
          classeStatut = "status refuse"; // Rouge
        }

        // 3. Création de la ligne HTML
        const ligneHTML = `
          <tr>
            <td><strong>${candidature.nom_entreprise}</strong></td>
            <td>${candidature.titre_offre}</td>
            <td>${dateCandidature}</td>
            <td><span class="${classeStatut}">${texteStatut}</span></td>
            <td>
              <a href="/offre-details.html?id=${candidature.id_offre}" class="btn-view">Détails</a>
            </td>
          </tr>
        `;

        // 4. Injection dans le tableau
        tbody.innerHTML += ligneHTML;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Erreur : ${data.message}</td></tr>`;
    }
  } catch (error) {
    console.error(
      "Erreur de fetch lors du chargement des candidatures :",
      error,
    );
    tbody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Impossible de charger les données.</td></tr>`;
  }
}

/* ==========================================================================
   AFFICHAGE DU CARNET DE STAGE (Format Cartes)
   ========================================================================== */
async function chargerCarnetStage() {
  const container = document.getElementById("carnet-container");
  if (!container) return;

  try {
    const response = await fetch("/api/carnet-stage");
    const data = await response.json();

    if (data.success) {
      container.innerHTML = "";

      if (data.data.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: #f9f9f9; border-radius: 8px; color: #888;">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 1rem; color: #ccc;"></i><br>
            Aucun stage n'est encore enregistré dans votre carnet.
          </div>`;
        return;
      }

      data.data.forEach((stage) => {
        // --- 1. PRÉPARATION DES VARIABLES (La clé du problème était ici !) ---

        // On formate les dates pour les calendriers (format YYYY-MM-DD exigé par <input type="date">)
        const dateDebutInput = new Date(stage.date_debut)
          .toISOString()
          .split("T")[0];
        const dateFinInput = new Date(stage.date_fin)
          .toISOString()
          .split("T")[0];

        // On crée les variables pour le onclick (en sécurisant les apostrophes pour éviter que le JS plante)
        const nomEnt = (stage.nom_entreprise || "").replace(/'/g, "\\'");
        const mission = (stage.mission || "").replace(/'/g, "\\'");
        const tuteur = (stage.tuteur || "").replace(/'/g, "\\'");

        // --- 2. FORMATAGE POUR L'AFFICHAGE ---
        const optionsMoisAnnee = { month: "long", year: "numeric" };
        const debutFormate = new Date(stage.date_debut).toLocaleDateString(
          "fr-FR",
          optionsMoisAnnee,
        );
        const finFormate = new Date(stage.date_fin).toLocaleDateString(
          "fr-FR",
          optionsMoisAnnee,
        );
        const periode = `${debutFormate.charAt(0).toUpperCase() + debutFormate.slice(1)} - ${finFormate.charAt(0).toUpperCase() + finFormate.slice(1)}`;

        // --- 3. GÉNÉRATION DU HTML ---
        container.innerHTML += `
          <div class="stage-card">
            <div class="stage-info">
              <span class="stage-dates">${periode}</span>
              <h3 style="padding-top: 1rem">${stage.nom_entreprise}</h3>
              <p>
                <strong>Mission :</strong> ${stage.mission}
              </p>
              <p>Tuteur : ${stage.tuteur || "Non renseigné"}</p>
            </div>
            <div class="actions">
              <a href="#" onclick="ouvrirModalModification(${stage.id_carnet}, '${nomEnt}', '${mission}', '${dateDebutInput}', '${dateFinInput}', '${tuteur}')">
                <i class="fa-solid fa-pen"></i> Modifier
              </a>
              <a href="#" onclick="supprimerStage(${stage.id_carnet})" title="Supprimer" style="color: #dc3545; margin-left: 10px;">
                <i class="fa-solid fa-trash"></i> Supprimer
              </a>
            </div>
          </div>
        `;
      });
    } else {
      container.innerHTML = `<p style="color: red; text-align: center;">Erreur : ${data.message}</p>`;
    }
  } catch (error) {
    console.error("Erreur chargement carnet :", error);
    container.innerHTML =
      '<p style="color: red; text-align: center;">Erreur de chargement du carnet.</p>';
  }
}

/* ==========================================================================
   GESTION DE L'AJOUT ET DE LA MODIFICATION DE STAGE (Modale)
   ========================================================================== */
async function configurerAjoutStage() {
  const form = document.getElementById("form-ajouter-stage");
  const msg = document.getElementById("msg-ajout");

  if (!form) return;

  // On utilise form.onsubmit au lieu de addEventListener pour éviter que l'action s'envoie en double !
  form.onsubmit = async (e) => {
    e.preventDefault(); // Empêche la page de se recharger

    // 1. Récupération de l'ID (si vide = Ajout, si rempli = Modification)
    const editId = document.getElementById("edit-id-stage").value;

    // 2. Récupération du nom de l'entreprise
    const selectEnt = document.getElementById("select-entreprise");
    const inputManuel = document.getElementById("ajout-entreprise-manuel");
    let entrepriseEnvoi = "";

    if (selectEnt.value === "autre") {
      entrepriseEnvoi = inputManuel.value;
    } else {
      entrepriseEnvoi = selectEnt.options[selectEnt.selectedIndex].text;
    }

    // 3. Préparation des données
    const bodyData = {
      entreprise: entrepriseEnvoi,
      mission: document.getElementById("ajout-mission").value,
      dateDebut: document.getElementById("ajout-debut").value,
      dateFin: document.getElementById("ajout-fin").value,
      tuteur: document.getElementById("ajout-tuteur").value,
    };

    // 4. LA MAGIE EST ICI : Choix de la route et de la méthode !
    // Si editId existe, on tape sur /api/stage-effectue/ID avec la méthode PUT
    // Sinon, on tape sur /api/stage-effectue avec la méthode POST
    const url = editId
      ? `/api/stage-effectue/${editId}`
      : "/api/stage-effectue";
    const methode = editId ? "PUT" : "POST";

    if (msg) {
      msg.textContent = "⏳ Enregistrement en cours...";
      msg.style.color = "#888";
    }

    try {
      // 5. On envoie au serveur
      const response = await fetch(url, {
        method: methode,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (data.success) {
        if (msg) {
          msg.textContent = "✅ " + data.message;
          msg.style.color = "green";
        }

        // On attend 1 seconde pour que l'étudiant voie le message vert, puis on ferme et on actualise
        setTimeout(() => {
          fermerModalStage();
          chargerCarnetStage(); // Magie : les cartes se mettent à jour toutes seules !
        }, 1000);
      } else {
        if (msg) {
          msg.textContent = "❌ " + data.message;
          msg.style.color = "red";
        }
      }
    } catch (err) {
      console.error("Erreur validation stage :", err);
      if (msg) {
        msg.textContent = "❌ Impossible de joindre le serveur.";
        msg.style.color = "red";
      }
    }
  };
}

// Fonction pour remplir le menu déroulant
async function chargerListeEntreprises() {
  const select = document.getElementById("select-entreprise");
  if (!select) return;

  try {
    const response = await fetch("/api/entreprises");
    const data = await response.json();

    if (data.success) {
      let options =
        '<option value="">-- Sélectionnez une entreprise --</option>';
      data.data.forEach((ent) => {
        options += `<option value="${ent.id_entreprise}">${ent.nom_entreprise}</option>`;
      });
      options +=
        '<option value="autre" style="font-weight: bold; color: #007bff;">+ Autre (Ajouter une nouvelle)</option>';
      select.innerHTML = options;
    }
  } catch (error) {
    console.error("Erreur chargement entreprises :", error);
  }
}

// Fonction pour cacher/afficher le champ texte selon le choix
function toggleAutreEntreprise() {
  const select = document.getElementById("select-entreprise");
  const blocAutre = document.getElementById("bloc-autre-entreprise");
  const inputManuel = document.getElementById("ajout-entreprise-manuel");

  if (select.value === "autre") {
    blocAutre.style.display = "block";
    inputManuel.required = true; // Devient obligatoire
  } else {
    blocAutre.style.display = "none";
    inputManuel.required = false;
    inputManuel.value = ""; // On vide la case
  }
}

async function supprimerStage(id) {
  if (!confirm("Es-tu sûr de vouloir supprimer ce stage de ton carnet ?"))
    return;

  try {
    const response = await fetch(`/api/stage-effectue/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (data.success) {
      // On recharge les cartes pour voir la disparition
      chargerCarnetStage();
    } else {
      alert("Erreur : " + data.message);
    }
  } catch (error) {
    console.error("Erreur suppression :", error);
  }
}

// Ouvre LA MÊME modale, mais la pré-remplit pour la modification
function ouvrirModalModification(id, nomEnt, mission, debut, fin, tuteur) {
  // 1. On stocke l'ID dans le champ caché
  document.getElementById("edit-id-stage").value = id;

  // 2. On change les textes pour que ce soit logique
  const titre = document.querySelector("#modal-ajouter-stage h2");
  if (titre) titre.textContent = "Modifier l'expérience";

  const btn = document.querySelector("#form-ajouter-stage .btn-submit");
  if (btn) btn.textContent = "Mettre à jour le stage";

  // 3. On remplit les cases
  document.getElementById("ajout-mission").value = mission;
  document.getElementById("ajout-debut").value = debut;
  document.getElementById("ajout-fin").value = fin;
  document.getElementById("ajout-tuteur").value = tuteur;

  // 4. Logique pour le menu déroulant de l'entreprise
  const select = document.getElementById("select-entreprise");
  let optionTrouvee = false;

  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].text === nomEnt) {
      select.selectedIndex = i;
      optionTrouvee = true;
      break;
    }
  }

  if (!optionTrouvee) {
    select.value = "autre";
    document.getElementById("ajout-entreprise-manuel").value = nomEnt;
  }
  toggleAutreEntreprise(); // Affiche ou cache le champ manuel si besoin

  // 5. On affiche la modale !
  const modal = document.getElementById("modal-ajouter-stage");
  if (modal) modal.style.display = "flex";
}

/* ==========================================================================
   RECHERCHE D'OFFRES
   ========================================================================== */
async function rechercherOffres() {
  const keyword = document.getElementById("search-keyword").value.trim();
  const location = document.getElementById("search-location").value.trim();
  const container = document.getElementById("offres-container");

  if (!container) return;

  container.innerHTML =
    '<p style="text-align: center; width: 100%; color: #888;"><i class="fa-solid fa-spinner fa-spin"></i> Recherche en cours...</p>';

  const params = new URLSearchParams();
  if (keyword) params.append("keyword", keyword);
  if (location) params.append("location", location);

  try {
    const response = await fetch(`/api/offres?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      container.innerHTML = "";

      if (data.data.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666; background: white; border: 1px solid #eaeaea; border-radius: 8px;">
            Aucune offre ne correspond à votre recherche. 😔
          </div>`;
        return;
      }

      data.data.forEach((offre) => {
        // On raccourcit la description pour que la carte reste propre
        const missionTexte = offre.mission
          ? offre.mission.substring(0, 150) + "..."
          : "Aucune description fournie.";

        // --- LA MAGIE EST LÀ : ON UTILISE TON CSS ---
        container.innerHTML += `
          <div class="job-card">
            <div class="job-company">${offre.nom_entreprise} — ${offre.ville}</div>
            <h3 class="job-title">${offre.titre_offre}</h3>
            <p class="job-details">${missionTexte}</p>
            <a href="offre-details.html?id=${offre.id_offre}" class="btn-view-offer">Voir l'offre</a>
          </div>
        `;
      });
    }
  } catch (error) {
    console.error("Erreur de recherche :", error);
    container.innerHTML = `<p style="grid-column: 1 / -1; color: red; text-align: center;">Impossible de charger les offres.</p>`;
  }
}

// Lancer une recherche vide au démarrage pour afficher toutes les offres par défaut
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("offres-container")) {
    rechercherOffres();
  }
});

// Optionnel : Lancer une recherche vide au démarrage pour afficher toutes les offres par défaut
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("offres-container")) {
    rechercherOffres();
  }
});

/* ==========================================================================
   ENVOYER LA CANDIDATURE (Formulaire avec CV et Lettre)
   ========================================================================== */
const formCandidature = document.getElementById("form-candidature");

if (formCandidature) {
  formCandidature.onsubmit = async (e) => {
    e.preventDefault(); // Empêche la page de se recharger

    // 1. Récupération des éléments HTML avec les BONS IDs
    const msg = document.getElementById("msg-candidature");
    const idOffre = document.getElementById("candidature-id-offre").value;
    const lettre = document.getElementById("lettre-motivation").value;
    const cvInput = document.getElementById("cv-upload");

    // 2. Sécurité : On vérifie que l'input existe ET qu'un fichier a bien été choisi
    if (!cvInput || !cvInput.files || cvInput.files.length === 0) {
      if (msg) {
        msg.textContent = "❌ Veuillez sélectionner un fichier pour votre CV.";
        msg.style.color = "red";
      }
      return; // On arrête tout si pas de CV
    }

    if (!idOffre) {
      msg.textContent = "❌ Erreur interne : ID de l'offre manquant.";
      msg.style.color = "red";
      return;
    }

    // 3. Préparation du "paquet" de données
    const formData = new FormData();
    formData.append("idOffre", idOffre);
    formData.append("lettreMotivation", lettre);
    formData.append("cv", cvInput.files[0]);

    if (msg) {
      msg.textContent = "⏳ Envoi de la candidature en cours...";
      msg.style.color = "#888";
    }

    try {
      // 4. Envoi au serveur
      const response = await fetch("/api/postuler", {
        method: "POST",
        body: formData, // On laisse le navigateur gérer le Content-Type tout seul !
      });

      const data = await response.json();

      // 5. Gestion de la réponse
      if (data.success) {
        if (msg) {
          msg.textContent = "✅ " + data.message;
          msg.style.color = "green";
        }

        // On ferme la modale après 2 secondes et on recharge la page
        setTimeout(() => {
          fermerModal(); // Assure-toi que cette fonction existe bien !
          window.location.reload();
        }, 2000);
      } else {
        if (msg) {
          msg.textContent = "❌ " + data.message;
          msg.style.color = "red";
        }
      }
    } catch (error) {
      console.error("Erreur lors de la candidature :", error);
      if (msg) {
        msg.textContent = "❌ Erreur de connexion au serveur.";
        msg.style.color = "red";
      }
    }
  };
}

// On lance les fonctions au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  chargerProfil();
  configurerModificationProfil();
  configurerChangementMdp();
  chargerMesCandidatures();
  chargerCarnetStage();
  configurerAjoutStage();
  chargerListeEntreprises();
});
