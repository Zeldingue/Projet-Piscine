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
          candidature.date_candidature
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

        // 3. Condition : Le bouton "Annuler" s'affiche UNIQUEMENT si en attente
        let btnAnnulerHTML = "";
        if (texteStatut === "En attente") {
          // On passe bien id_offre au lieu de id_candidature !
          btnAnnulerHTML = `
            <a href="#" class="btn-cancel" onclick="annulerCandidature(${candidature.id_offre}); return false;">
              <i class="fa-solid fa-trash"></i> Retirer
            </a>`;
        } else {
          // Si traité, on affiche un petit cadenas informatif
          btnAnnulerHTML = `
            <span style="color: #888; font-size: 0.85rem; margin-left: 10px;">
              <i class="fa-solid fa-lock"></i> Dossier traité
            </span>`;
        }

        // 4. Création de la ligne HTML
        const ligneHTML = `
          <tr>
            <td><strong>${candidature.nom_entreprise}</strong></td>
            <td>${candidature.titre_offre}</td>
            <td>${dateCandidature}</td>
            <td><span class="${classeStatut}">${texteStatut}</span></td>
            <td>
              <a href="/offre-details.html?id=${candidature.id_offre}" class="btn-view">Détails</a>
              ${btnAnnulerHTML}
            </td>
          </tr>
        `;

        // 5. Injection dans le tableau
        tbody.innerHTML += ligneHTML;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Erreur : ${data.message}</td></tr>`;
    }
  } catch (error) {
    console.error(
      "Erreur de fetch lors du chargement des candidatures :",
      error
    );
    tbody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Impossible de charger les données.</td></tr>`;
  }
}

async function annulerCandidature(idOffre) {
  if (!confirm("Êtes-vous sûr de vouloir retirer cette candidature ? Cette action est définitive.")) {
    return;
  }

  try {
    // On utilise bien la méthode DELETE
    const response = await fetch(`/api/annuler-candidature/${idOffre}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (data.success) {
      alert("✅ " + data.message);
      chargerMesCandidatures(); // Recharge le tableau instantanément
    } else {
      alert("❌ " + data.message);
    }
  } catch (error) {
    console.error("Erreur lors de l'annulation de la candidature :", error);
    alert("Impossible de joindre le serveur.");
  }
}

// Appel de la fonction au chargement de la page (uniquement si on est sur le dashboard étudiant)
document.addEventListener("DOMContentLoaded", () => {
  chargerMesCandidatures();
  configurerAjoutStage();
});
