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

function ouvrirModal() {
  document.getElementById("modal-postuler").classList.add("active");
  document.body.style.overflow = "hidden";
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

function ouvrirModalStage() {
  document.getElementById("modal-ajouter-stage").classList.add("active");
  document.body.style.overflow = "hidden";
}

function fermerModalStage() {
  document.getElementById("modal-ajouter-stage").classList.remove("active");
  document.body.style.overflow = "auto";
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

  // Si on n'est pas sur une page qui contient ces champs, on arrête la fonction
  if (!nomElement || !prenomElement || !emailElement) return;

  try {
    const response = await fetch("/api/profil");
    const data = await response.json();

    if (data.success) {
      const utilisateur = data.data;

      // Grâce à l'astuce "AS" en SQL, on utilise les mêmes noms pour tout le monde !
      nomElement.value = utilisateur.nom || "";
      prenomElement.value = utilisateur.prenom || "";
      emailElement.value = utilisateur.email || "";

      if (telephoneElement) {
        telephoneElement.value = utilisateur.telephone || "";
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

  if (!formMdp) return;

  formMdp.addEventListener("submit", async (e) => {
    e.preventDefault(); // Empêche la page de se recharger brusquement

    const ancienMdp = document.getElementById("ancien-mdp").value;
    const nouveauMdp = document.getElementById("nouveau-mdp").value;
    const confirmMdp = document.getElementById("confirm-mdp").value;

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
      const response = await fetch("/api/etudiant/mot-de-passe", {
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
        formMdp.reset(); // Vide les champs
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

// On lance les deux fonctions au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  chargerProfil();
  configurerChangementMdp();
});

document.addEventListener("DOMContentLoaded", chargerProfilEtudiant);

/* ==========================================================================
   GESTION DU CHANGEMENT DE MOT DE PASSE (Profil Étudiant)
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
      const response = await fetch("/api/etudiant/mot-de-passe", {
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

// On lance la configuration au chargement de la page
document.addEventListener("DOMContentLoaded", configurerChangementMdp);
