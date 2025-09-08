// Importa las librerías necesarias
import fetch from "node-fetch";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

// Reemplaza 'TU_CLAVE_API' con tu clave real.
const NEVI_API_KEY = 'ellen';
const NEVI_API_ENDPOINT = 'http://neviapi.ddns.net:5000';

const SIZE_LIMIT_MB = 100;
const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⸙ְ̻࠭ꪆ🦈 𝐄llen 𝐉ᴏ𝐞 𖥔 Sᥱrvice';

// --- Funciones de Utilidad ---
const sendMediaFile = async (conn, m, downloadUrl, title, currentMode) => {
  try {
    const response = await axios.head(downloadUrl);
    const contentLength = response.headers['content-length'];
    const fileSizeMb = contentLength / (1024 * 1024);

    let mediaOptions = {};

    if (fileSizeMb > SIZE_LIMIT_MB) {
      mediaOptions = {
        document: { url: downloadUrl },
        fileName: `${title}.${currentMode === 'audio' ? 'mp3' : 'mp4'}`,
        mimetype: currentMode === 'audio' ? 'audio/mpeg' : 'video/mp4',
        caption: `⚠️ *El archivo es muy grande (${fileSizeMb.toFixed(2)} MB), así que lo envío como documento. Puede tardar más en descargar.*
🖤 *Título:* ${title}`
      };
      await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
      await m.react("📄");
    } else {
      mediaOptions = currentMode === 'audio'
        ? { audio: { url: downloadUrl }, mimetype: "audio/mpeg", fileName: `${title}.mp3` }
        : { video: { url: downloadUrl }, caption: `🎬 *Listo.*
🖤 *Título:* ${title}`, fileName: `${title}.mp4`, mimetype: "video/mp4" };

      await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
      await m.react(currentMode === 'audio' ? "🎧" : "📽️");
    }
  } catch (error) {
    console.error("Error al obtener el tamaño del archivo o al enviarlo:", error);
    throw new Error("No se pudo obtener el tamaño del archivo o falló el envío.");
  }
};

// --- Manejador Principal ---
const handler = async (m, { conn, args, usedPrefix, command }) => {
  const name = conn.getName(m.sender);
  args = args.filter(v => v?.trim());

  const contextInfo = {
    mentionedJid: [m.sender],
    isForwarded: true,
    forwardingScore: 999,
    forwardedNewsletterMessageInfo: {
      newsletterJid,
      newsletterName,
      serverMessageId: -1
    },
    externalAdReply: {
      title: '🖤 ⏤͟͟͞͞𝙀𝙇𝙇𝙀𝙉 - 𝘽𝙊𝙏 ᨶ႒ᩚ',
      body: `✦ 𝙀𝙨𝙥𝙚𝙧𝙖𝙣𝙙𝙤 t𝙪 𝙨𝙤𝙡𝙞𝙘𝙞𝙩𝙪𝙙, ${name}. ♡~٩( ˃▽˂ )۶~♡`,
      thumbnail: icons,
      sourceUrl: redes,
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  if (!args[0]) {
    return conn.reply(m.chat, `🦈 *¿᥎іᥒіs𝗍ᥱ ᥲ ⍴ᥱძіrmᥱ ᥲᥣg᥆ sіᥒ sᥲᑲᥱr 𝗊ᥙᥱ́?*
ძі ᥣ᥆ 𝗊ᥙᥱ 𝗊ᥙіᥱrᥱs... ᥆ ᥎ᥱ𝗍ᥱ.

🎧 ᥱȷᥱm⍴ᥣ᥆s:
${usedPrefix}tiktok https://www.tiktok.com/@user/video/123456789`, m, { contextInfo });
  }

  const isMode = ["audio", "video"].includes(args[0].toLowerCase());
  const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");

  // CAMBIO: Validación de URL más robusta con expresión regular
  const isInputUrl = /^(https?:\/\/)?(www\.)?(vm\.|vt\.)?tiktok\.com\/.+$/i.test(queryOrUrl);

  if (!isInputUrl) {
    return conn.reply(m.chat, `💔 *Esa no es una URL de TikTok.*
Solo soporto URLs directas.`, m, { contextInfo });
  }

  await m.react("🔎");

  try {
    const neviApiUrl = `${NEVI_API_ENDPOINT}/tiktok`;
    
    if (isMode) {
      const mode = args[0].toLowerCase();
      const action = mode === "audio" ? "download_audio" : "download_video";
      
      const res = await fetch(neviApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': NEVI_API_KEY,
        },
        body: JSON.stringify({
          url: queryOrUrl,
          action: action
        }),
      });
      
      const json = await res.json();
      
      if (json.status === "success" && json.download_link) {
        const videoTitle = json.title || 'Título Desconocido';
        await sendMediaFile(conn, m, json.download_link, videoTitle, mode);
        return;
      }
      throw new Error(`Fallo de la API: ${json.message || 'Respuesta inválida.'}`);

    } else {
      const res = await fetch(neviApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': NEVI_API_KEY,
        },
        body: JSON.stringify({
          url: queryOrUrl,
          action: "info"
        }),
      });

      const json = await res.json();

      if (json.status !== "success" || !json.title) {
        throw new Error("No se encontraron metadatos.");
      }

      const { uploader, music_title, title, description, thumbnail_link } = json;

      const buttons = [
        { buttonId: `${usedPrefix}tiktok video ${queryOrUrl}`, buttonText: { displayText: '🎬 𝙑𝙄𝘿𝙀𝙊' }, type: 1 },
        { buttonId: `${usedPrefix}tiktok audio ${queryOrUrl}`, buttonText: { displayText: '🎧 𝘼𝙐𝘿𝙄𝙊' }, type: 1 }
      ];

      const finalDescription = description || title || 'Sin descripción';
      const finalMusicTitle = music_title || 'Desconocida';
      const finalUploader = uploader || 'Desconocido';

      const caption = `
┈۪۪۪۪۪۪۪۪ٜ̈᷼─۪۪۪۪ٜ࣪᷼┈۪۪۪۪۪۪۪۪ٜ݊᷼⁔᮫ּׅ̫ׄ࣪︵᮫ּ๋ׅׅ۪۪۪۪ׅ࣪࣪͡⌒🌀𔗨⃪̤̤̤ٜ۫۫۫҈҈҈҈҉҉᷒ᰰ꤬۫۫۫𔗨̤̤̤𐇽─۪۪۪۪ٜ᷼┈۪۪۪۪۪۪۪۪ٜ̈᷼─۪۪۪۪ٜ࣪᷼┈۪۪۪۪݊᷼
₊‧꒰ 🎧꒱ 𝙀𝙇𝙇𝙀𝙉 𝙅𝙊𝙀 𝘽𝙊𝙏 — 𝙋𝙇𝘼𝙔 𝙈𝙊𝘿𝙀 ✧˖°
︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶   ︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶   ︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶

> ૢ⃘꒰👤⃝︩֟፝𐴲ⳋᩧ᪲ *Autor:* ${finalUploader}
> ૢ⃘꒰💬⃝︩֟፝𐴲ⳋᩧ᪲ *Descripción:* ${finalDescription}
> ૢ⃘꒰🎵⃝︩֟፝𐴲ⳋᩧ᪲ *Música:* ${finalMusicTitle}
> ૢ⃘꒰🔗⃝︩֟፝𐴲ⳋᩧ᪲ *URL:* ${queryOrUrl}
⌣᮫ֶุ࣪ᷭ⌣〫᪲꒡᳝۪︶᮫໋࣭〭〫𝆬࣪࣪𝆬࣪꒡ֶ〪࣪ ׅ۫ெ᮫〪⃨〫〫᪲࣪˚̥ׅ੭ֶ֟ৎ᮫໋ׅ̣𝆬  ּ֢̊࣪⡠᮫ ໋🦈᮫ຸ〪〪〫〫ᷭ ݄࣪⢄ꠋּ֢ ࣪ ֶׅ੭ֶ̣֟ৎ᮫˚̥࣪ெ᮫〪〪⃨〫᪲ ࣪꒡᮫໋〭࣪𝆬࣪︶〪᳝۪ꠋּ꒡ׅ⌣᮫ֶ࣪᪲⌣᮫ຸ᳝〫֩ᷭ
     ᷼͝ ᮫໋⏝᮫໋〪ׅ〫𝆬⌣ׄ𝆬᷼᷼᷼᷼᷼᷼᷼᷼᷼⌣᷑︶᮫᷼͡︶ׅ ໋𝆬⋰᩠〫 ᮫ׄ ׅ𝆬 ⠸᮫ׄ ׅ ⋱〫 ۪۪ׄ᷑𝆬︶᮫໋᷼͡︶ׅ 𝆬⌣᮫〫ׄ᷑᷼᷼᷼᷼᷼᷼᷼᷼᷼⌣᜔᮫ׄ⏝᜔᮫๋໋〪ׅ〫 ᷼͝`;

      await conn.sendMessage(m.chat, {
        image: { url: thumbnail_link },
        caption,
        footer: 'Dime cómo lo quieres... o no digas nada ┐(￣ー￣)┌.',
        buttons,
        headerType: 4,
        contextInfo
      }, { quoted: m });
    }

  } catch (e) {
    console.error("Error al procesar la solicitud de TikTok:", e);
    return conn.reply(m.chat, `💔 *Fallé al procesar tu capricho.*
Esa URL me da un dolor de cabeza, ¿estás seguro de que es una URL de TikTok válida?`, m, { contextInfo });
  }
};

handler.help = ['tiktok'].map(v => v + ' <URL>');
handler.tags = ['descargas'];
handler.command = ['tiktok'];
handler.register = true;
handler.prefix = /^[./#]/;

export default handler;
