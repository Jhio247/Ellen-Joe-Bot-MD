import fs from 'fs';
import path from 'path';

export const createMiddlemanFile = async () => {
  try {
    // Ruta donde quieres crear el archivo (ajústala si es necesario)
    const filePath = path.join(process.cwd(), 'plugins', 'middleman.js');

    // Código que quieres guardar
    const code = `
// ======= CONFIGURACIÓN =======
const MIDDLEMEN = [
  '234480048595079', // Middleman 1
  '2401020997833',  // Middleman 2
  '31749019021550', // Middleman 3
  '8594565156955',  // Middleman 4
  '192844685955318',// Middleman 5
  '178507598549077' // Middleman 6
];

// Ahora guardamos currentTrade por grupo
global.currentTrades = {}; // { [groupId]: tradeData }

// ======= COMANDO #middleman =======
let handler = async (m, { conn }) => {
  let from = m.chat;
  let user1 = m.sender;
  let user2 = (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : null;

  if (!user2) {
    return conn.reply(from, "⚠️ Debes mencionar a la persona con la que quieres hacer el trade.\\n\\nEjemplo: \`#middleman @usuario\`", m);
  }

  if (global.currentTrades[from]) {
    return conn.reply(from, "⚠️ Ya hay un trade en proceso en este grupo. Espera que finalice.", m);
  }

  global.currentTrades[from] = {
    requester: user1,
    partner: user2,
    taken: false,
    timer: null
  };

  await conn.reply(from, "⌛ Buscando middleman disponible...\\nLos middleman tienen **1 hora** para aceptar.", m);

  for (let mm of MIDDLEMEN) {
    await conn.sendMessage(mm, { 
      text: \`📩 Nueva solicitud de middleman en grupo \${from}\\n\\nParticipantes:\\n👤 \${user1}\\n👤 \${user2}\\n\\nResponde *si* para aceptar (tienes 1 hora).\` 
    });
  }

  // Timeout de 1 hora (3600000 ms)
  global.currentTrades[from].timer = setTimeout(async () => {
    if (!global.currentTrades[from].taken) {
      await conn.reply(from, "❌ Ningún middleman aceptó la solicitud dentro de 1 hora.", m);
      delete global.currentTrades[from];
    }
  }, 3600000);
};

handler.command = /^middleman$/i;
export default handler;

// ======= RESPUESTA DE MIDDLEMEN =======
export async function before(m, { conn }) {
  const from = m.chat;
  if (!global.currentTrades[from] || global.currentTrades[from].taken) return;
  if (!MIDDLEMEN.includes(m.sender)) return;

  if (m.text && m.text.toLowerCase() === "si") {
    global.currentTrades[from].taken = true;
    clearTimeout(global.currentTrades[from].timer);

    let tradeGroup = await conn.groupCreate("TRADE", [
      global.currentTrades[from].requester,
      global.currentTrades[from].partner,
      m.sender
    ]);

    await conn.sendMessage(tradeGroup.id, { 
      text: \`✅ Middleman disponible: @\${m.sender.split("@")[0]}\\n\\nSe ha creado este grupo para el intercambio.\`,
      mentions: [m.sender, global.currentTrades[from].requester, global.currentTrades[from].partner]
    });

    delete global.currentTrades[from];
  }
}
`;

    // Crear el archivo
    fs.writeFileSync(filePath, code, 'utf-8');
    console.log(`✅ middleman.js creado en: ${filePath}`);
  } catch (err) {
    console.error("❌ Error al crear middleman.js:", err);
  }
};

// Si quieres puedes llamarlo directamente
createMiddlemanFile();
