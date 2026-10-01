import React, { useEffect, useState } from "react";
import axios from "axios";
import { Layers } from "lucide-react";

function DoctorSpecialities() {

  const API = "http://localhost:8000/api/specialites";

  const [specialites, setSpecialites] = useState([]);
  const [nom, setNom] = useState("");
  const [editId, setEditId] = useState(null);

  // ============================
  // Charger les spécialités
  // ============================

  const getSpecialites = async () => {
    try {
      const res = await axios.get(API);
      setSpecialites(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSpecialites();
  }, []);

  // ============================
  // Ajouter ou Modifier
  // ============================

  const saveSpecialite = async () => {

    if (nom.trim() === "") {
      alert("Veuillez saisir une spécialité.");
      return;
    }

    try {

      if (editId) {

        await axios.put(
          `${API}/${editId}`,
          { nom }
        );

      } else {

        await axios.post(
          API,
          { nom }
        );

      }

      setNom("");
      setEditId(null);

      getSpecialites();

    } catch (error) {

      console.log(error);

    }

  };

  // ============================
  // Modifier
  // ============================

  const editSpecialite = (specialite) => {

    setEditId(specialite.id);
    setNom(specialite.nom);

  };

  // ============================
  // Supprimer
  // ============================

  const deleteSpecialite = async (id) => {

    if (!window.confirm("Supprimer cette spécialité ?")) return;

    try {

      await axios.delete(`${API}/${id}`);

      getSpecialites();

    } catch (error) {

      console.log(error);

    }

  };

  return (

          <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
          <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Layers size={26} className="text-white" />
              </div>
              <div>
                  <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                      Gestion des spécialités
                  </h1>
                  <p className="text-blue-100 text-sm mt-0.5">
                      Gestion des spécialités médicales.
                  </p>
              </div>
          </div>
      </div>

  );

}

export default DoctorSpecialities;