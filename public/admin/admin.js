/* ==========================================================================
   CHARGER LES STATISTIQUES (Dashboard Admin)
   ========================================================================== */
async function chargerStatsAdmin() {
  const elEtudiants = document.getElementById("stat-etudiants");
  const elEntreprises = document.getElementById("stat-entreprises");
  const elOffres = document.getElementById("stat-offres");
  const elSignalements = document.getElementById("stat-signalements");

  // Si on n'est pas sur la bonne page, on arrête la fonction
  if (!elEtudiants || !elEntreprises || !elOffres || !elSignalements) return;

  try {
    const response = await fetch("/api/admin/stats");
    const data = await response.json();

    if (data.success) {
      // On injecte les vrais chiffres
      elEtudiants.textContent = data.stats.etudiants;
      elEntreprises.textContent = data.stats.entreprises;
      elOffres.textContent = data.stats.offres;
      elSignalements.textContent = data.stats.signalements;
    } else {
      console.error(data.message);
      elEtudiants.textContent = "-";
      elEntreprises.textContent = "-";
      elOffres.textContent = "-";
      elSignalements.textContent = "-";
    }
  } catch (error) {
    console.error("Erreur de connexion au serveur :", error);
    elEtudiants.textContent = "Erreur";
    elEntreprises.textContent = "Erreur";
    elOffres.textContent = "Erreur";
    elSignalements.textContent = "Erreur";
  }
}

// Lancement automatique au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  chargerStatsAdmin();
});

/* ==========================================================================
   PAGE : GESTION DES UTILISATEURS (admin-utilisateurs.js)
   ========================================================================== */

let listeUtilisateurs = [];

// 1. Charger les données depuis le serveur
async function chargerUtilisateurs() {
  const tbody = document.getElementById("table-utilisateurs-body");
  if (!tbody) return;

  try {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Chargement...</td></tr>`;

    // Appel à la future route serveur
    const response = await fetch("/api/admin/utilisateurs");
    const data = await response.json();

    if (data.success) {
      listeUtilisateurs = data.utilisateurs;
      afficherUtilisateurs(); // On appelle la fonction d'affichage
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Erreur: ${data.message}</td></tr>`;
    }
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Erreur de connexion.</td></tr>`;
  }
}

// 2. Afficher et filtrer les données
function afficherUtilisateurs() {
  const tbody = document.getElementById("table-utilisateurs-body");
  const recherche = document.getElementById("search-user").value.toLowerCase();
  const ongletActif = document.querySelector(".tabs .active").id; // tab-tous, tab-etudiants, tab-entreprises

  tbody.innerHTML = "";

  // Logique de filtrage
  const utilisateursFiltres = listeUtilisateurs.filter((u) => {
    // Filtre par texte (nom, prenom ou email)
    const texte = (
      u.nom +
      " " +
      (u.prenom || "") +
      " " +
      u.email
    ).toLowerCase();
    const correspondRecherche = texte.includes(recherche);

    // Filtre par onglet
    let correspondOnglet = true;
    if (ongletActif === "tab-etudiants")
      correspondOnglet = u.type === "etudiant";
    if (ongletActif === "tab-entreprises")
      correspondOnglet = u.type === "entreprise";

    return correspondRecherche && correspondOnglet;
  });

  if (utilisateursFiltres.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">Aucun utilisateur trouvé.</td></tr>`;
    return;
  }

  // Génération du tableau
  utilisateursFiltres.forEach((u) => {
    const isBanni = u.statut === "Banni";
    const statutHTML = isBanni
      ? `<span style="color: #f44336; font-weight: 600;">Banni</span>`
      : `<span style="color: #1e8e3e; font-weight: 600;">Actif</span>`;

    const badgeHTML =
      u.type === "etudiant"
        ? `<span class="badge role-etudiant">Étudiant</span>`
        : `<span class="badge role-entreprise">Entreprise</span>`;

    const detailHTML =
      u.type === "etudiant"
        ? u.detail_formation
        : `Contact: ${u.detail_contact}`;
    const nomAffiche = u.type === "etudiant" ? `${u.prenom} ${u.nom}` : u.nom;

    // Bouton d'action (Bannir ou Débannir)
    const actionHTML = isBanni
      ? `<a href="#" style="color: #1e8e3e" onclick="debannirUtilisateur(${u.id}, '${u.type}'); return false;"><i class="fa-solid fa-unlock"></i> Débannir</a>`
      : `<a href="#" style="color: #f44336" onclick="ouvrirModalBan(${u.id}, '${u.type}'); return false;"><i class="fa-solid fa-gavel"></i> Bannir</a>`;

    tbody.innerHTML += `
      <tr ${isBanni ? 'style="background-color: #fff9fa;"' : ""}>
        <td>
          <strong>${nomAffiche}</strong><br />
          <span style="font-size: 0.85rem; color: #666">${detailHTML || ""}</span>
        </td>
        <td>${u.email}</td>
        <td>${badgeHTML}</td>
        <td>${statutHTML}</td>
        <td class="action-btns">${actionHTML}</td>
      </tr>
    `;
  });
}

// 3. Gestion de la Modale de Bannissement
function ouvrirModalBan(id, type) {
  document.getElementById("ban-user-id").value = id;
  document.getElementById("ban-user-type").value = type;
  document.getElementById("msg-ban").textContent = "";
  document.getElementById("modal-ban").style.display = "flex";
}

function fermerModalBan() {
  document.getElementById("modal-ban").style.display = "none";
  document.getElementById("form-ban").reset();
}

const formBan = document.getElementById("form-ban");
if (formBan) {
  formBan.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("ban-user-id").value;
    const type = document.getElementById("ban-user-type").value;
    const motif = document.getElementById("ban-motif").value;
    const msg = document.getElementById("msg-ban");

    msg.textContent = "⏳ Application de la sanction...";
    msg.style.color = "#888";

    try {
      const response = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, motif }),
      });
      const data = await response.json();

      if (data.success) {
        msg.textContent = "✅ Utilisateur banni.";
        msg.style.color = "green";
        setTimeout(() => {
          fermerModalBan();
          chargerUtilisateurs(); // Recharge le tableau
        }, 1500);
      } else {
        msg.textContent = "❌ " + data.message;
        msg.style.color = "red";
      }
    } catch (error) {
      msg.textContent = "❌ Erreur serveur.";
      msg.style.color = "red";
    }
  };
}

// 4. Écouteurs d'événements pour les filtres interactifs
document.addEventListener("DOMContentLoaded", () => {
  chargerUtilisateurs();

  // Recherche textuelle (se déclenche à chaque lettre tapée)
  const inputRecherche = document.getElementById("search-user");
  if (inputRecherche)
    inputRecherche.addEventListener("input", afficherUtilisateurs);

  // Clics sur les onglets
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // On retire la classe active partout
      tabBtns.forEach((b) => b.classList.remove("active"));
      // On l'ajoute sur le bouton cliqué
      e.target.classList.add("active");
      // On met à jour l'affichage
      afficherUtilisateurs();
    });
  });
});

/* ==========================================================================
   PAGE : MODÉRATION DES OFFRES (admin-offres.js)
   ========================================================================== */

let listeOffres = [];

async function chargerOffresAdmin() {
  const tbody = document.getElementById("table-offres-body");
  if (!tbody) return;

  try {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Chargement des annonces...</td></tr>`;

    const response = await fetch("/api/admin/offres");
    const data = await response.json();

    if (data.success) {
      listeOffres = data.offres;
      afficherOffres();
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Erreur: ${data.message}</td></tr>`;
    }
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Erreur de connexion.</td></tr>`;
  }
}

function afficherOffres() {
  const tbody = document.getElementById("table-offres-body");
  const recherche = document.getElementById("search-offre").value.toLowerCase();
  const ongletActif = document.querySelector(".tabs .active").id; // tab-tous, tab-actives, tab-signalements, tab-bloquees

  tbody.innerHTML = "";

  const offresFiltrees = listeOffres.filter((o) => {
    // Filtre texte
    const texte = (o.titre_offre + " " + o.nom_entreprise).toLowerCase();
    const correspondRecherche = texte.includes(recherche);

    // Filtre onglets
    let correspondOnglet = true;
    if (ongletActif === "tab-actives") correspondOnglet = o.statut === "active";
    if (ongletActif === "tab-bloquees")
      correspondOnglet = o.statut === "bloquée";
    if (ongletActif === "tab-signalements")
      correspondOnglet = o.nb_signalements > 0;

    return correspondRecherche && correspondOnglet;
  });

  if (offresFiltrees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">Aucune offre trouvée.</td></tr>`;
    return;
  }

  offresFiltrees.forEach((o) => {
    // Formatage des dates
    const optionsDate = { day: "numeric", month: "short" };
    const dateDeb = new Date(o.date_debut).toLocaleDateString(
      "fr-FR",
      optionsDate,
    );
    const dateFin = new Date(o.date_fin).toLocaleDateString(
      "fr-FR",
      optionsDate,
    );

    // Gestion du badge de statut
    let badgeStatut = `<span class="badge status-inactive">Inactif</span>`;
    if (o.statut === "active")
      badgeStatut = `<span class="badge status-active">En ligne</span>`;
    if (o.statut === "bloquée")
      badgeStatut = `<span class="badge status-blocked">Bloquée</span>`;

    // Gestion de l'affichage des signalements
    const htmlSignalement =
      o.nb_signalements > 0
        ? `<a href="#" onclick="ouvrirModalSignalements(${o.id_offre}); return false;" style="color: #dc3545; font-weight: bold; text-decoration: underline;"><i class="fa-solid fa-flag"></i> ${o.nb_signalements} signalement(s)</a>`
        : `<span style="color: #888;">0</span>`;

    // Boutons d'action
    const isBloquee = o.statut === "bloquée";
    const actionHTML = isBloquee
      ? `<a href="#" style="color: #1e8e3e" onclick="debloquerOffre(${o.id_offre}); return false;"><i class="fa-solid fa-unlock"></i> Débloquer</a>`
      : `<a href="#" style="color: #f44336" onclick="ouvrirModalBlockOffre(${o.id_offre}); return false;"><i class="fa-solid fa-ban"></i> Bloquer</a>`;

    tbody.innerHTML += `
      <tr ${isBloquee ? 'style="background-color: #fff9fa;"' : ""}>
        <td>
          <strong>${o.titre_offre}</strong><br />
          <span style="font-size: 0.85rem; color: #666"><i class="fa-regular fa-building"></i> ${o.nom_entreprise}</span>
        </td>
        <td>${dateDeb} - ${dateFin}</td>
        <td>${badgeStatut}</td>
        <td>${htmlSignalement}</td>
        <td class="action-btns">
          <a href="/offre-details.html?id=${o.id_offre}" style="color: #586b33" target="_blank"><i class="fa-solid fa-eye"></i> Voir</a>
          ${actionHTML}
        </td>
      </tr>
    `;
  });
}

// Gestion de la Modale de Blocage d'Offre
function ouvrirModalBlockOffre(idOffre) {
  document.getElementById("block-offre-id").value = idOffre;
  document.getElementById("msg-block").textContent = "";
  document.getElementById("modal-block").style.display = "flex";
}

function fermerModalBlockOffre() {
  document.getElementById("modal-block").style.display = "none";
  document.getElementById("form-block-offre").reset();
}

const formBlockOffre = document.getElementById("form-block-offre");
if (formBlockOffre) {
  formBlockOffre.onsubmit = async (e) => {
    e.preventDefault();
    const idOffre = document.getElementById("block-offre-id").value;
    const motif = document.getElementById("block-motif").value;
    const msg = document.getElementById("msg-block");

    msg.textContent = "⏳ Blocage en cours...";
    msg.style.color = "#888";

    try {
      const response = await fetch(`/api/admin/offre/${idOffre}/block`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif }),
      });
      const data = await response.json();

      if (data.success) {
        msg.textContent = "✅ Offre bloquée.";
        msg.style.color = "green";
        setTimeout(() => {
          fermerModalBlockOffre();
          chargerOffresAdmin();
        }, 1500);
      } else {
        msg.textContent = "❌ " + data.message;
        msg.style.color = "red";
      }
    } catch (error) {
      msg.textContent = "❌ Erreur serveur.";
      msg.style.color = "red";
    }
  };
}

// Écouteurs pour le filtrage
document.addEventListener("DOMContentLoaded", () => {
  chargerOffresAdmin();

  const inputRecherche = document.getElementById("search-offre");
  if (inputRecherche) inputRecherche.addEventListener("input", afficherOffres);

  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      afficherOffres();
    });
  });
});

async function debannirUtilisateur(id, type) {
  if (!confirm("Voulez-vous vraiment lever la sanction de cet utilisateur ?"))
    return;
  try {
    const response = await fetch(`/api/admin/ban/${type}/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (data.success) chargerUtilisateurs();
  } catch (e) {
    alert("Erreur.");
  }
}

async function debloquerOffre(idOffre) {
  if (!confirm("Autoriser à nouveau la publication de cette offre ?")) return;
  try {
    const response = await fetch(`/api/admin/offre/${idOffre}/unblock`, {
      method: "PUT",
    });
    const data = await response.json();
    if (data.success) chargerOffresAdmin();
  } catch (e) {
    alert("Erreur.");
  }
}

/* ==========================================================================
   MODALE DES SIGNALEMENTS
   ========================================================================== */
async function ouvrirModalSignalements(idOffre) {
  const container = document.getElementById("liste-signalements-body");
  document.getElementById("modal-voir-signalements").style.display = "flex";

  container.innerHTML = `<div style="text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Chargement...</div>`;

  try {
    const response = await fetch(`/api/admin/offre/${idOffre}/signalements`);
    const data = await response.json();

    if (data.success) {
      container.innerHTML = "";

      if (data.signalements.length === 0) {
        container.innerHTML = "<p>Aucun signalement trouvé.</p>";
        return;
      }

      // On affiche chaque signalement sous forme de petite carte
      data.signalements.forEach((sig) => {
        const dateSig = new Date(sig.date_signalement).toLocaleDateString(
          "fr-FR",
        );

        container.innerHTML += `
          <div style="background: #f9f9f9; border-left: 4px solid #dc3545; padding: 1rem; margin-bottom: 1rem; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <strong style="color: #333;">${sig.motif}</strong>
              <span style="font-size: 0.85rem; color: #888;">Le ${dateSig}</span>
            </div>
            <p style="margin-bottom: 0.5rem; color: #555; font-size: 0.95rem;">${sig.description || "<em>Aucune description supplémentaire fournie.</em>"}</p>
            <div style="font-size: 0.8rem; color: #888; text-align: right;">
              Signalé par : ${sig.prenom_etudiant} ${sig.nom_etudiant}
            </div>
          </div>
        `;
      });
    } else {
      container.innerHTML = `<p style="color: red;">Erreur de chargement.</p>`;
    }
  } catch (error) {
    container.innerHTML = `<p style="color: red;">Erreur serveur.</p>`;
  }
}

function fermerModalSignalements() {
  document.getElementById("modal-voir-signalements").style.display = "none";
}

/* ==========================================================================
   PAGE : HISTORIQUE DES BANS (admin-historique-bans.js)
   ========================================================================== */

async function chargerHistoriqueBans() {
  const tbody = document.getElementById("table-bans-body");
  if (!tbody) return;

  try {
    const response = await fetch("/api/admin/historique-bans");
    const data = await response.json();

    if (data.success) {
      tbody.innerHTML = "";

      if (data.historique.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">Aucun bannissement dans l'historique.</td></tr>`;
        return;
      }

      data.historique.forEach((ban) => {
        // Formatage de la date (ex: 14 Mai 2026)
        const dateBan = new Date(ban.date_bannissement).toLocaleDateString(
          "fr-FR",
          { day: "numeric", month: "short", year: "numeric" },
        );

        // Nom à afficher
        const nomAffiche =
          ban.type === "etudiant" ? `${ban.prenom} ${ban.nom}` : ban.nom;

        // Badge de type
        const badgeType =
          ban.type === "etudiant"
            ? `<span class="badge role-etudiant" style="background-color: #e3f2fd; color: #1976d2; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.8rem;">Étudiant</span>`
            : `<span class="badge role-entreprise" style="background-color: #f3e5f5; color: #7b1fa2; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.8rem;">Entreprise</span>`;

        // Gestion du statut (Définitif ou Temporaire)
        const statutBan =
          ban.date_fin === null
            ? `<span style="background-color: #fce8e6; color: #d93025; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">Définitif</span>`
            : `<span style="background-color: #fff3e0; color: #e65100; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">Temporaire</span>`;

        tbody.innerHTML += `
          <tr>
            <td>${dateBan}</td>
            <td>
              <strong>${nomAffiche}</strong><br />
              <small style="color: #666;">${ban.email}</small>
            </td>
            <td>${badgeType}</td>
            <td>${ban.motif}</td>
            <td>${statutBan}</td>
            <td class="action-btns" style="display: flex; gap: 10px;">
              <button onclick="annulerBan('${ban.type}', ${ban.id_utilisateur})" class="btn-action" title="Annuler le ban (Débannir)" style="background: none; border: none; color: #1e8e3e; cursor: pointer; font-size: 1.1rem;">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            </td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erreur lors du chargement de l'historique.</td></tr>`;
    }
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erreur de connexion au serveur.</td></tr>`;
  }
}

// Fonction pour débannir directement depuis l'historique
async function annulerBan(type, idUtilisateur) {
  if (
    !confirm(
      "Voulez-vous vraiment lever la sanction de cet utilisateur ? Il pourra à nouveau se connecter.",
    )
  )
    return;

  try {
    // On réutilise la route DELETE qu'on a déjà créée pour la page utilisateurs !
    const response = await fetch(`/api/admin/ban/${type}/${idUtilisateur}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (data.success) {
      chargerHistoriqueBans(); // On rafraîchit le tableau
    } else {
      alert("Erreur lors de l'annulation du bannissement.");
    }
  } catch (error) {
    alert("Erreur de connexion au serveur.");
  }
}

// Lancement au chargement
document.addEventListener("DOMContentLoaded", () => {
  chargerHistoriqueBans();
});
