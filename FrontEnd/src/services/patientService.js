import axios from "axios";

const API_URL = "http://localhost:8000/api/patients";


// Récupérer tous les patients
export const getPatients = () => {
  return axios.get(API_URL);
};


// Récupérer un patient par ID
export const getPatient = (id) => {
  return axios.get(`${API_URL}/${id}`);
};


// Ajouter un patient
export const addPatient = (data) => {
  // Ne PAS fixer manuellement "Content-Type": "multipart/form-data" :
  // axios génère automatiquement le bon header AVEC le boundary
  // quand on lui passe un FormData. Le fixer soi-même casse le boundary
  // et Laravel ne peut plus parser le fichier envoyé.
  return axios.post(API_URL, data);
};


// Modifier un patient avec image
export const updatePatient = (id, data) => {
  // Même chose ici : on laisse axios gérer le Content-Type tout seul.
  // Le "_method=PUT" en query string permet à Laravel de traiter
  // cette requête POST comme un PUT (nécessaire pour que le multipart
  // soit bien parsé, PHP ne le fait pas nativement sur PUT/PATCH).
  return axios.post(`${API_URL}/${id}?_method=PUT`, data);
};


// Supprimer un patient
export const deletePatient = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};