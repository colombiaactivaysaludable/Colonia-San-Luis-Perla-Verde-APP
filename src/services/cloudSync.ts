import { db } from '../firebaseConfig';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

export const cloudSync = {
  init: () => {
    try {
      // Escucha partidos en tiempo real desde Firestore
      onSnapshot(collection(db, 'matches'), (snapshot) => {
        const matches = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem('app_matches', JSON.stringify(matches));
        window.dispatchEvent(new Event('storage_updated'));
      });

      // Escucha jugadores en tiempo real desde Firestore
      onSnapshot(collection(db, 'players'), (snapshot) => {
        const players = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem('app_players', JSON.stringify(players));
        window.dispatchEvent(new Event('storage_updated'));
      });
    } catch (e) {
      console.error("Error inicializando CloudSync:", e);
    }
  },

  // Guarda/Actualiza un documento directamente en Firestore
  saveDocument: async (collectionName: string, id: string, data: any) => {
    try {
      await setDoc(doc(db, collectionName, id), data, { merge: true });
    } catch (e) {
      console.error(`Error al guardar en ${collectionName}:`, e);
    }
  }
};
