// ---------------------------
// script.js (versión corregida y robusta)
// ---------------------------

document.addEventListener("DOMContentLoaded", () => {
  // --- Ajustes visuales básicos (puedes mantenerlos aquí) ---
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.height = "100vh";
  document.body.style.overflow = "hidden";
  document.body.style.display = "flex";
  document.body.style.flexDirection = "column";
  document.body.style.justifyContent = "center";
  document.body.style.alignItems = "center";
  document.body.style.fontFamily = "Comic Sans MS, Poppins, sans-serif";
  document.body.style.background = "linear-gradient(135deg, #f9f9ff, #fff5e6)";
  document.body.style.transition = "background 1s ease";

  // referencias DOM
  const maggieImg = document.getElementById("maggie");
  const startBtn = document.getElementById("start");
  const wordDisplay = document.getElementById("word-display");
  const messageEl = document.getElementById("message");

  // seguridad por si alguno falta
  if(!maggieImg || !startBtn || !wordDisplay || !messageEl){
    console.error("Elementos HTML requeridos no encontrados. Comprueba index.html");
    return;
  }

  // estilos y animaciones ligeras
  maggieImg.style.maxHeight = "50vh";
  maggieImg.style.objectFit = "contain";
  maggieImg.style.transition = "transform 0.35s ease, filter 0.35s ease";
  maggieImg.style.marginBottom = "15px";

  startBtn.style.fontSize = "2em";
  startBtn.style.padding = "12px 34px";
  startBtn.style.borderRadius = "24px";
  startBtn.style.border = "none";
  startBtn.style.background = "linear-gradient(45deg, #ff6b6b, #ffcc00)";
  startBtn.style.color = "white";
  startBtn.style.cursor = "pointer";
  startBtn.style.boxShadow = "0px 6px 18px rgba(0,0,0,0.18)";
  startBtn.style.transition = "transform 0.25s ease, box-shadow 0.25s ease, opacity 0.6s";
  startBtn.style.opacity = "1";

  wordDisplay.style.fontSize = "3em";
  wordDisplay.style.margin = "8px";
  wordDisplay.style.color = "#333";
  wordDisplay.style.textAlign = "center";
  wordDisplay.style.textShadow = "2px 2px #ffcc00";

  messageEl.style.position = "absolute";
  messageEl.style.top = "18%";
  messageEl.style.textAlign = "center";
  messageEl.style.width = "100%";
  messageEl.style.fontSize = "2.2em";
  messageEl.style.fontWeight = "700";
  messageEl.style.opacity = "0";
  messageEl.style.transition = "opacity 0.4s, transform 0.4s";

  // --- Palabras ---
  const words = [
    {"word": "apple", "translation": "manzana"},
    {"word": "dog", "translation": "perro"},
    {"word": "cat", "translation": "gato"},
    {"word": "ball", "translation": "pelota"},
    {"word": "hello", "translation": "hola"},
    {"word": "goodbye", "translation": "adiós"},
    {"word": "thank you", "translation": "gracias"},
    {"word": "please", "translation": "por favor"},
    {"word": "yes", "translation": "sí"},
    {"word": "no", "translation": "no"},
    {"word": "book", "translation": "libro"},
    {"word": "car", "translation": "coche"},
    {"word": "house", "translation": "casa"},
    {"word": "water", "translation": "agua"},
    {"word": "milk", "translation": "leche"},
    {"word": "bread", "translation": "pan"},
    {"word": "sun", "translation": "sol"},
    {"word": "moon", "translation": "luna"},
    {"word": "star", "translation": "estrella"},
    {"word": "friend", "translation": "amigo"}
  ];

  let remainingWords = [...words];
  let currentWord = null;
  let recognitionActive = false;

  // --- Helpers: gestionar voces (asegura que hay voces cargadas) ---
  function loadVoices() {
    return new Promise(resolve => {
      const voices = speechSynthesis.getVoices();
      if (voices && voices.length) return resolve(voices);
      // si aún no están, esperar al evento
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices());
      };
      // timeout de seguridad por si no llega
      setTimeout(() => resolve(speechSynthesis.getVoices()), 1500);
    });
  }

  // speak devuelve Promise y anima la boca
  async function speak(text){
    const voices = await loadVoices();
    return new Promise((resolve, reject) => {
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.voice = voices.find(v => v.lang && v.lang.toLowerCase().includes("en")) || voices[0];
        utter.pitch = 1.1;
        utter.rate = 0.95;

        // animación boca
        maggieImg.src = "./images/mouth-open.png";
        maggieImg.style.transform = "scale(1.05)";
        maggieImg.style.filter = "brightness(1.05)";

        utter.onend = () => {
          maggieImg.src = "./images/maggie.png";
          maggieImg.style.transform = "scale(1)";
          maggieImg.style.filter = "brightness(1)";
          resolve();
        };
        utter.onerror = (e) => {
          maggieImg.src = "./images/maggie.png";
          maggieImg.style.transform = "scale(1)";
          reject(e);
        };

        speechSynthesis.speak(utter);
      } catch (err) {
        reject(err);
      }
    });
  }

  // mostrar mensaje visual (promise)
  function showMessage(text, duration = 1500, color = "#32cd32"){
    messageEl.textContent = text;
    messageEl.style.color = color;
    messageEl.style.opacity = "1";
    messageEl.style.transform = "translateY(0px)";
    return new Promise(resolve => {
      setTimeout(() => {
        messageEl.style.opacity = "0";
        messageEl.style.transform = "translateY(-10px)";
        resolve();
      }, duration);
    });
  }

  // --- Reconocimiento robusto (promise) ---
  function startRecognitionOnce(timeoutMs = 6000) {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SpeechRecognition) {
        reject(new Error("Reconocimiento no soportado"));
        return;
      }
      if (recognitionActive) {
        // prevenir solapamientos
        reject(new Error("Reconocimiento ya activo"));
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionActive = true;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let finished = false;
      const onResult = (event) => {
        finished = true;
        recognitionActive = false;
        const spoken = event.results[0][0].transcript.toLowerCase();
        resolve(spoken);
      };
      const onError = (e) => {
        finished = true;
        recognitionActive = false;
        reject(e.error || e.message || new Error("Error reconocimiento"));
      };
      const onEnd = () => {
        if(!finished) {
          recognitionActive = false;
          reject(new Error("No speech detected"));
        }
      };

      recognition.onresult = onResult;
      recognition.onerror = onError;
      recognition.onend = onEnd;
      try {
        recognition.start();
      } catch (err) {
        recognitionActive = false;
        reject(err);
        return;
      }

      // timeout para evitar quedarse esperando indefinidamente
      const t = setTimeout(() => {
        if(!finished){
          try { recognition.stop(); } catch(e) {}
          recognitionActive = false;
          reject(new Error("timeout"));
        }
      }, timeoutMs);

      // limpiar timeout si termina antes
      const cleanup = () => clearTimeout(t);
      recognition.onresult = (event) => { cleanup(); onResult(event); };
      recognition.onerror = (e) => { cleanup(); onError(e); };
      recognition.onend = () => { cleanup(); onEnd(); };
    });
  }

  // --- Lógica del flujo: siguiente palabra, comprobación y bucle ---
  async function handleCurrentWord() {
    if(!currentWord) return;
    // decir palabra ya hecha por speak en nextWord; ahora esperar reconocimiento
    try {
      const spoken = await startRecognitionOnce(7000).catch(e => { throw e; });
      console.log("Reconocido:", spoken);
      if (spoken.includes(currentWord.word.toLowerCase())) {
        await speak("Well done!");
        await showMessage("¡Bien hecho! 🌟", 1500, "#32c48a");
        // siguiente palabra
        nextWord();
      } else {
        // fallo: animación y reintento (replicar comportamiento previo)
        await speak("Try again");
        // repetir palabra y volver a escuchar
        await speak(currentWord.word);
        // pequeña pausa antes de reintentar
        setTimeout(() => {
          handleCurrentWord().catch(err => console.warn("reintento fallo:", err.message));
        }, 200);
      }
    } catch (err) {
      console.warn("Reconocimiento falló:", err && err.message ? err.message : err);
      // si hay fallo (timeout, permiso denegado...), informar y permitir reintento manual
      await showMessage("No te he escuchado, pulsa Start para intentar", 1800, "#e07a7a");
      // mostrar Start para reintento
      startBtn.style.display = "inline-block";
    }
  }

  function nextWord() {
    if(remainingWords.length === 0) {
      showFinalScreen();
      return;
    }
    const idx = Math.floor(Math.random() * remainingWords.length);
    currentWord = remainingWords[idx];
    remainingWords.splice(idx, 1);
    wordDisplay.textContent = currentWord.word;
    // hablamos la palabra y cuando termine llamamos a handleCurrentWord
    speak(currentWord.word).then(() => {
      // pequeña pausa para que el navegador habilite micrófono sin solaparse
      setTimeout(() => { handleCurrentWord().catch(err => console.warn(err)); }, 200);
    }).catch(err => {
      console.error("TTS error:", err);
      // aun así, intentar reconocimiento
      setTimeout(() => { handleCurrentWord().catch(e=>console.warn(e)); }, 200);
    });
  }

  // --- pantalla final ---
  function showFinalScreen(){
    startBtn.style.display = "none";
    wordDisplay.style.display = "none";
    messageEl.style.display = "none";
    maggieImg.style.display = "none";

    document.body.style.background = "linear-gradient(135deg, #fff7cc, #ffecd1)";

    const finalDiv = document.createElement("div");
    finalDiv.id = "final-screen";
    finalDiv.style.textAlign = "center";
    finalDiv.innerHTML = `
      <h1 style="font-size:3em;color:#ff6600;">🎊 ¡Nivel completado! 🎊</h1>
      <p style="font-size:1.2em;color:#444;">¡Muy bien! Has completado el nivel.</p>
      <img src="./images/congratulations.png" alt="Felicidades" style="max-width:80%;margin-top:10px;">
      <canvas id="confetti-canvas" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
    `;
    document.body.appendChild(finalDiv);
    speak("Congratulations!");
    startConfetti();
  }

  // confeti simple (igual que antes)
  function startConfetti(){
    const canvas = document.getElementById("confetti-canvas");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const confetti = Array.from({length: 140}, () => ({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height - canvas.height,
      r: Math.random()*6 + 2,
      d: Math.random()*1 + 1,
      color: `hsl(${Math.random()*360}, 100%, 60%)`
    }));
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      confetti.forEach(p=>{
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      update();
      requestAnimationFrame(draw);
    }
    function update(){
      confetti.forEach(p=>{
        p.y += p.d;
        if(p.y > canvas.height){ p.y = -10; p.x = Math.random()*canvas.width; }
      });
    }
    draw();
  }

  // --- animación ligera de espera (parpadeo) ---
  // Requiere que tengas images/maggie-blink.png
  function gentleIdleAnimation(){
    if (!maggieImg) return;
    setInterval(() => {
      if(speechSynthesis.speaking) return;
      maggieImg.style.transform = "rotate(-1.8deg)";
      setTimeout(()=> maggieImg.style.transform = "rotate(1.8deg)", 320);
      setTimeout(()=> maggieImg.style.transform = "rotate(0deg)", 640);
      // parpadeo rápido
      setTimeout(()=>{
        const orig = maggieImg.src;
        maggieImg.src = "./images/maggie-blink.png";
        setTimeout(()=> { if(!speechSynthesis.speaking) maggieImg.src = orig; }, 140);
      }, 360);
    }, 5200);
  }
  gentleIdleAnimation();

  // --- Start handler: decir "Let's begin" y arrancar flujo ---
  startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    try {
      await speak("Let's begin");
    } catch(e){
      console.warn("TTS 'Let's begin' falló:", e);
    }
    // arrancar la primera palabra
    nextWord();
  });

  // Habilitar tecla espacio como Start (opcional)
  window.addEventListener("keydown", (e) => {
    if(e.code === "Space" && startBtn.style.display !== "none") {
      e.preventDefault();
      startBtn.click();
    }
  });

  // Mensaje inicial pequeño
  messageEl.textContent = "Pulsa Start para comenzar";
  messageEl.style.opacity = "1";
  setTimeout(()=> messageEl.style.opacity = "0", 1400);
});
