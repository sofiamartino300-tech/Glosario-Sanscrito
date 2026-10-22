import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, doc, getDoc, collection, getDocs, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBawh0xxCSsxMEvPK8vLyJPyKjMsmt9t-E",
  authDomain: "glosario-e6252.firebaseapp.com",
  projectId: "glosario-e6252",
  storageBucket: "glosario-e6252.firebasestorage.app",
  messagingSenderId: "211219897792",
  appId: "1:211219897792:web:be8f72494f6990af57fc25",
  measurementId: "G-573G5QS0D0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔹 Función para normalizar texto (quita acentos y signos)
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina diacríticos
    .replace(/[^a-z0-9\s]/gi, "");   // elimina símbolos raros
}

// 🔹 Buscar palabra (exacta o normalizada)
async function buscarPalabra(palabra = null) {
  if (!palabra) palabra = document.getElementById("buscar").value.trim();

  // 1️⃣ Coincidencia exacta
  let docRef = doc(db, "diccionario", palabra);
  let docSnap = await getDoc(docRef);

  // 2️⃣ Si no existe, buscar por coincidencia normalizada
  if (!docSnap.exists()) {
    const palabraNormalizada = normalizarTexto(palabra);
    const querySnapshot = await getDocs(collection(db, "diccionario"));

    for (const docSnapIter of querySnapshot.docs) {
      const idNormalizado = normalizarTexto(docSnapIter.id);
      if (idNormalizado === palabraNormalizada) {
        docSnap = docSnapIter;
        docRef = doc(db, "diccionario", docSnapIter.id);
        break;
      }
    }
  }

  // 3️⃣ Mostrar resultado
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.querySelector(".resultado").innerHTML = `
  <div class="entrada">
    <h2 class="titulo-palabra">${docSnap.id}</h2>
    <p class="definicion">${data.definicion}</p>
  </div>
`;
    await updateDoc(docRef, { busquedas: (data.busquedas || 0) + 1 });
    actualizarLista();
  } else {
    document.querySelector(".resultado").innerHTML = "❌ No se encontró esa palabra.";
  }
}

// 🔹 Actualizar lista de más buscadas
async function actualizarLista() {
  const querySnapshot = await getDocs(collection(db, "diccionario"));
  const lista = document.getElementById("lista-buscadas");
  lista.innerHTML = "";

  const palabrasOrdenadas = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const cantidad = data.busquedas || 0;
    if (cantidad > 0) {
      palabrasOrdenadas.push([docSnap.id, cantidad]);
    }
  });

  palabrasOrdenadas.sort((a, b) => b[1] - a[1]);
  const topPalabras = palabrasOrdenadas.slice(0, 10);

  topPalabras.forEach(([palabra, cantidad]) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="#" onclick="buscarPalabra('${palabra}')">${palabra} (${cantidad})</a>`;
    lista.appendChild(li);
  });
}

// Llamar al cargar
actualizarLista();

// 🔹 Modo oscuro/claro
function toggleMode() {
  document.body.classList.toggle("dark-mode");
  document.body.classList.toggle("light-mode");
}
window.toggleMode = toggleMode;
window.buscarPalabra = buscarPalabra;

// 🔹 Probar conexión
async function probarConexion() {
  try {
    const snapshot = await getDocs(collection(db, "diccionario"));
    console.log("✅ Conexión exitosa. Documentos:", snapshot.size);
  } catch (error) {
    console.error("❌ Error de conexión:", error);
  }
}
probarConexion();

