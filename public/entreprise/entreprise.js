/* ==========================================================================
   AJOUTER UNE OFFRE (Entreprise)
   ========================================================================== */
function configuererAjouterOffre() {
  const form = document.getElementById("form-nouvelle-offre");
  // Correction ici : "document" au lieu de "DocumentTimeline"
  const msg = document.getElementById("msg-ajout");

  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();

    // Ajout des .value pour lire ce que l'utilisateur a tapé
    const bodyData = {
      titre: document.getElementById("titre").value.trim(),
      dateDebut: document.getElementById("date-debut").value,
      dateFin: document.getElementById("date-fin").value,
      mission: document.getElementById("mission").value.trim(),
      tuteur: document.getElementById("tuteur").value.trim(),
    };

    // On affiche un petit message d'attente s'il y a une div prévue pour ça
    if (msg) {
      msg.textContent = "⏳ Publication en cours...";
      msg.style.color = "#888";
    }

    try {
      // ON APPELLE LE SERVEUR
      const response = await fetch("/api/ajouter-offre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (data.success) {
        if (msg) {
          msg.textContent = "✅ " + data.message;
          msg.style.color = "green";
        }
        form.reset(); // On vide les cases

        // Redirection après 2 secondes vers le tableau de bord
        setTimeout(() => {
          window.location.href = "entreprise-dashboard.html";
        }, 2000);
      } else {
        if (msg) {
          msg.textContent = "❌ " + data.message;
          msg.style.color = "red";
        }
      }
    } catch (error) {
      console.error(error);
      if (msg) {
        msg.textContent = "❌ Erreur de connexion au serveur.";
        msg.style.color = "red";
      }
    }
  };
}

/* ==========================================================================
   CHARGER LE DASHBOARD ENTREPRISE (Format Tableau)
   ========================================================================== */
// Variable globale pour stocker les offres et y accéder facilement pour la modale
let listeOffres = [];

async function chargerDashboardEntreprise() {
  const tbody = document.getElementById("table-offres-body");
  if (!tbody) return;

  try {
    const response = await fetch("/api/mes-offres");
    const data = await response.json();

    if (data.success) {
      tbody.innerHTML = "";
      listeOffres = data.data; // On sauvegarde les offres !

      if (listeOffres.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 3rem; color: #666;">Vous n'avez publié aucune offre pour le moment.</td></tr>`;
        return;
      }

      listeOffres.forEach((offre) => {
        const optionsDate = { day: "numeric", month: "short" };
        const dateDeb = new Date(offre.date_debut).toLocaleDateString(
          "fr-FR",
          optionsDate,
        );
        const dateFin = new Date(offre.date_fin).toLocaleDateString(
          "fr-FR",
          optionsDate,
        );

        const statutTexte = offre.statut === "active" ? "En ligne" : "Inactif";
        const statutCouleur = offre.statut === "active" ? "#1e8e3e" : "#d93025";

        const styleBadge =
          offre.nb_candidats == 0
            ? "background-color: #f1f3f4; color: #5f6368;"
            : "";
        const texteBadge =
          offre.nb_candidats == 0
            ? "Aucune"
            : `${offre.nb_candidats} candidat(s)`;

        // MODIFICATION ICI : On ajoute des onclick sur Modifier et Supprimer
        tbody.innerHTML += `
          <tr>
            <td><strong>${offre.titre_offre}</strong></td>
            <td>${dateDeb} - ${dateFin}</td>
            <td>
              <a href="entreprise-candidatures.html?id=${offre.id_offre}" class="badge" style="${styleBadge}">${texteBadge}</a>
            </td>
            <td style="color: ${statutCouleur}; font-weight: 500;">${statutTexte}</td>
            <td class="action-btns">
              <a href="entreprise-candidatures.html?id=${offre.id_offre}">Candidats</a>
              <a href="#" onclick="ouvrirModalEditOffre(${offre.id_offre}); return false;">Modifier</a>
              <a href="#" style="color: #dc3545" onclick="supprimerOffre(${offre.id_offre}); return false;">Supprimer</a>
            </td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red; padding: 2rem;">Erreur de chargement.</td></tr>`;
  }
}

/* ==========================================================================
   MODIFIER UNE OFFRE (Modale)
   ========================================================================== */
function ouvrirModalEditOffre(idOffre) {
  // On retrouve l'offre exacte dans notre liste sauvegardée
  const offre = listeOffres.find((o) => o.id_offre === idOffre);
  if (!offre) return;

  // On remplit les champs (Astuce : split('T')[0] permet de garder juste YYYY-MM-DD pour l'input date)
  document.getElementById("edit-id-offre").value = offre.id_offre;
  document.getElementById("edit-titre").value = offre.titre_offre;
  document.getElementById("edit-date-debut").value =
    offre.date_debut.split("T")[0];
  document.getElementById("edit-date-fin").value = offre.date_fin.split("T")[0];
  document.getElementById("edit-tuteur").value = offre.tuteur_nom || "";
  document.getElementById("edit-mission").value = offre.mission;
  document.getElementById("edit-statut").value = offre.statut || "active";

  document.getElementById("msg-edit-offre").textContent = "";
  document.getElementById("modal-edit-offre").style.display = "flex";
}

function fermerModalEditOffre() {
  document.getElementById("modal-edit-offre").style.display = "none";
}

// Validation de la modification
const formEditOffre = document.getElementById("form-edit-offre");
if (formEditOffre) {
  formEditOffre.onsubmit = async (e) => {
    e.preventDefault();
    const idOffre = document.getElementById("edit-id-offre").value;
    const msg = document.getElementById("msg-edit-offre");

    const bodyData = {
      titre: document.getElementById("edit-titre").value,
      dateDebut: document.getElementById("edit-date-debut").value,
      dateFin: document.getElementById("edit-date-fin").value,
      tuteur: document.getElementById("edit-tuteur").value,
      mission: document.getElementById("edit-mission").value,
      statut: document.getElementById("edit-statut").value,
    };

    msg.textContent = "⏳ Sauvegarde...";
    msg.style.color = "#888";

    try {
      const response = await fetch(`/api/offre/${idOffre}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      const data = await response.json();

      if (data.success) {
        msg.textContent = "✅ " + data.message;
        msg.style.color = "green";
        setTimeout(() => {
          fermerModalEditOffre();
          chargerDashboardEntreprise(); // On recharge le tableau !
        }, 1500);
      } else {
        msg.textContent = "❌ Erreur : " + data.message;
        msg.style.color = "red";
      }
    } catch (error) {
      msg.textContent = "❌ Erreur de connexion.";
      msg.style.color = "red";
    }
  };
}

/* ==========================================================================
   SUPPRIMER UNE OFFRE
   ========================================================================== */
async function supprimerOffre(idOffre) {
  if (
    !confirm(
      "Êtes-vous sûr de vouloir supprimer cette offre ? Cette action est définitive.",
    )
  )
    return;

  try {
    const response = await fetch(`/api/offre/${idOffre}`, { method: "DELETE" });
    const data = await response.json();

    if (data.success) {
      alert("✅ " + data.message);
      chargerDashboardEntreprise(); // On met à jour le tableau en direct
    } else {
      alert("❌ " + data.message);
    }
  } catch (error) {
    alert("❌ Erreur de connexion au serveur.");
  }
}

/* ==========================================================================
   PAGE : CANDIDATURES (entreprise-candidatures.html)
   ========================================================================== */
async function chargerCandidaturesOffre() {
  const tbody = document.getElementById("table-candidatures-body");
  if (!tbody) return; // Si on n'est pas sur la bonne page, on arrête

  // On récupère l'ID de l'offre dans l'URL (ex: ?id=2)
  const urlParams = new URLSearchParams(window.location.search);
  const idOffre = urlParams.get("id");

  if (!idOffre) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erreur : Offre introuvable.</td></tr>`;
    return;
  }

  try {
    const response = await fetch(`/api/offre/${idOffre}/candidatures`);
    const data = await response.json();

    if (data.success) {
      // On met à jour l'en-tête de la page
      document.getElementById("header-offre-id").textContent =
        `Offre #${data.offre.id_offre}`;
      document.getElementById("header-offre-titre").textContent =
        data.offre.titre_offre;

      tbody.innerHTML = "";

      if (data.candidatures.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">Aucune candidature pour le moment.</td></tr>`;
        return;
      }

      data.candidatures.forEach((c) => {
        // Formatage de la date
        const dateCandidature = new Date(c.date_candidature).toLocaleDateString(
          "fr-FR",
          { day: "2-digit", month: "2-digit" },
        );

        // Couleur du statut
        let couleurStatut = "#856404"; // Jaune (En attente)
        if (c.statut === "Accepté") couleurStatut = "#1e8e3e"; // Vert
        if (c.statut === "Refusé") couleurStatut = "#d93025"; // Rouge

        // Gestion des boutons (On les cache si la décision est déjà prise)
        let boutonsAction = "";
        if (c.statut === "En attente") {
          boutonsAction = `
            <a href="#" class="btn-action btn-accept" onclick="changerStatutCandidature(${idOffre}, ${c.id_etudiant}, 'Accepté'); return false;" style="color: #1e8e3e; margin-right: 10px; text-decoration: none; font-weight: bold;">Accepter</a>
            <a href="#" class="btn-action btn-reject" onclick="changerStatutCandidature(${idOffre}, ${c.id_etudiant}, 'Ref usé'); return false;" style="color: #d93025; text-decoration: none; font-weight: bold;">Refuser</a>
          `;
        } else {
          boutonsAction = `<span style="color: #888; font-size: 0.9rem;">Décision prise</span>`;
        }

        tbody.innerHTML += `
          <tr>
            <td>
              <strong>${c.prenom_etudiant} ${c.nom_etudiant}</strong><br />
              <span style="font-size: 0.85rem; color: #666">${c.email_etudiant}</span>
            </td>
            <td>${c.formation_etudiant || "Non renseigné"}</td>
            <td>${dateCandidature}</td>
            <td>
              ${c.cv_fichier ? `<a href="/uploads/cvs/${c.cv_fichier}" target="_blank" class="btn-action btn-view" style="color: #586b33; text-decoration: none; font-weight: bold;"><i class="fa-solid fa-file-pdf"></i> Voir CV</a>` : `<span style="color: #888">Pas de CV</span>`}
            </td>
            <td>
              <span style="font-weight: 600; color: ${couleurStatut}">${c.statut}</span>
            </td>
            <td>${boutonsAction}</td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erreur de connexion.</td></tr>`;
  }
}

// Fonction pour changer le statut
async function changerStatutCandidature(idOffre, idEtudiant, nouveauStatut) {
  if (
    !confirm(
      `Voulez-vous vraiment marquer ce candidat comme "${nouveauStatut}" ?`,
    )
  )
    return;

  try {
    const response = await fetch(`/api/candidature/${idOffre}/${idEtudiant}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: nouveauStatut }),
    });

    const data = await response.json();
    if (data.success) {
      chargerCandidaturesOffre(); // On recharge le tableau direct !
    } else {
      alert("Erreur lors de la mise à jour.");
    }
  } catch (error) {
    alert("Erreur de connexion.");
  }
}

/* ==========================================================================
   PAGE : CANDIDATURES (entreprise-candidatures.html)
   ========================================================================== */
let listeCandidatures = []; // Pour stocker les données et retrouver les lettres

async function chargerCandidaturesOffre() {
  const tbody = document.getElementById("table-candidatures-body");
  if (!tbody) return;

  const urlParams = new URLSearchParams(window.location.search);
  const idOffre = urlParams.get("id");

  if (!idOffre) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erreur : Offre introuvable.</td></tr>`;
    return;
  }

  try {
    const response = await fetch(`/api/offre/${idOffre}/candidatures`);
    const data = await response.json();

    if (data.success) {
      document.getElementById("header-offre-id").textContent =
        `Offre #${data.offre.id_offre}`;
      document.getElementById("header-offre-titre").textContent =
        data.offre.titre_offre;

      tbody.innerHTML = "";
      listeCandidatures = data.candidatures; // On sauvegarde !

      if (listeCandidatures.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">Aucune candidature pour le moment.</td></tr>`;
        return;
      }

      listeCandidatures.forEach((c) => {
        const dateCandidature = new Date(c.date_candidature).toLocaleDateString(
          "fr-FR",
          { day: "2-digit", month: "2-digit" },
        );

        let couleurStatut = "#856404";
        if (c.statut === "Accepté") couleurStatut = "#1e8e3e";
        if (c.statut === "Refusé") couleurStatut = "#d93025";

        let boutonsAction = "";
        if (c.statut === "En attente") {
          boutonsAction = `
            <a href="#" class="btn-action btn-accept" onclick="changerStatutCandidature(${idOffre}, ${c.id_etudiant}, 'Accepté'); return false;" style="color: #1e8e3e; margin-right: 10px; text-decoration: none; font-weight: bold;">Accepter</a>
            <a href="#" class="btn-action btn-reject" onclick="changerStatutCandidature(${idOffre}, ${c.id_etudiant}, 'Refusé'); return false;" style="color: #d93025; text-decoration: none; font-weight: bold;">Refuser</a>
          `;
        } else {
          boutonsAction = `<span style="color: #888; font-size: 0.9rem;">Décision prise</span>`;
        }

        // --- NOUVEAU : Création des boutons CV et Lettre ---
        const btnCV = c.cv_fichier
          ? `<a href="/uploads/cvs/${c.cv_fichier}" target="_blank" style="color: #586b33; text-decoration: none; font-weight: bold; margin-right: 15px;"><i class="fa-solid fa-file-pdf"></i> CV</a>`
          : `<span style="color: #888; margin-right: 15px;">Pas de CV</span>`;

        const btnLettre = c.lettre_motivation
          ? `<a href="#" onclick="ouvrirModalLettre(${c.id_etudiant}); return false;" style="color: #4a5568; text-decoration: none; font-weight: bold;"><i class="fa-solid fa-envelope"></i> Lettre</a>`
          : `<span style="color: #888;">Pas de lettre</span>`;

        tbody.innerHTML += `
          <tr>
            <td>
              <strong>${c.prenom_etudiant} ${c.nom_etudiant}</strong><br />
              <span style="font-size: 0.85rem; color: #666">${c.email_etudiant}</span>
            </td>
            <td>${c.formation_etudiant || "Non renseigné"}</td>
            <td>${dateCandidature}</td>
            <td>
              <div style="display: flex; align-items: center;">
                ${btnCV}
                ${btnLettre}
              </div>
            </td>
            <td><span style="font-weight: 600; color: ${couleurStatut}">${c.statut}</span></td>
            <td>${boutonsAction}</td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erreur de connexion.</td></tr>`;
  }
}

// Fonction pour changer le statut (inchangée)
async function changerStatutCandidature(idOffre, idEtudiant, nouveauStatut) {
  if (
    !confirm(
      `Voulez-vous vraiment marquer ce candidat comme "${nouveauStatut}" ?`,
    )
  )
    return;

  try {
    const response = await fetch(`/api/candidature/${idOffre}/${idEtudiant}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: nouveauStatut }),
    });

    const data = await response.json();
    if (data.success) {
      chargerCandidaturesOffre();
    } else {
      alert("Erreur lors de la mise à jour.");
    }
  } catch (error) {
    alert("Erreur de connexion.");
  }
}

/* ==========================================================================
   MODALE LETTRE DE MOTIVATION
   ========================================================================== */
function ouvrirModalLettre(idEtudiant) {
  // On cherche l'étudiant dans notre liste sauvegardée
  const candidature = listeCandidatures.find(
    (c) => c.id_etudiant === idEtudiant,
  );

  if (candidature && candidature.lettre_motivation) {
    document.getElementById("contenu-lettre").textContent =
      candidature.lettre_motivation;
    document.getElementById("modal-lettre").style.display = "flex";
  }
}

function fermerModalLettre() {
  document.getElementById("modal-lettre").style.display = "none";
}

/* ==========================================================================
   CHARGER LES STATISTIQUES (Dashboard)
   ========================================================================== */
async function chargerStatsDashboard() {
  const elCandidatures = document.getElementById("stat-candidatures");
  const elActives = document.getElementById("stat-actives");

  // Si les éléments n'existent pas sur cette page, on ne fait rien
  if (!elCandidatures || !elActives) return;

  try {
    const response = await fetch("/api/entreprise/stats");
    const data = await response.json();

    if (data.success) {
      elCandidatures.textContent = data.stats.candidatures;
      elActives.textContent = data.stats.actives;
    } else {
      elCandidatures.textContent = "0";
      elActives.textContent = "0";
    }
  } catch (error) {
    console.error("Erreur de chargement des statistiques :", error);
    elCandidatures.textContent = "-";
    elActives.textContent = "-";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  chargerDashboardEntreprise();
  configuererAjouterOffre();
  chargerCandidaturesOffre();
  chargerCandidaturesOffre();
  chargerStatsDashboard();
});
