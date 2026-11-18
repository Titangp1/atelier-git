/* Atelier Git · connexion au service de comptes (Firebase).
   Objet firebaseConfig de l'application Web (console Firebase > Paramètres du projet).
   Ces valeurs sont publiques par conception : la sécurité vient des règles Firestore (firebase/firestore.rules).
   Remplacez l'objet par null pour faire tourner le site sans comptes. */
window.ATELIER_CONFIG={
  firebase:{
    apiKey:'AIzaSyDk2Y1AeWGmnIhRrghPVrdGt1fbF_aK7XM',
    authDomain:'atelier-git.firebaseapp.com',
    projectId:'atelier-git',
    storageBucket:'atelier-git.firebasestorage.app',
    messagingSenderId:'185161311957',
    appId:'1:185161311957:web:85ea9dd41f34f37e29c45c'
  }
};
