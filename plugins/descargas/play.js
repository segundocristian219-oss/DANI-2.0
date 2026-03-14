import fetch from 'node-fetch'

const handler = async (m, { conn, text, command }) => {
  await conn.sendMessage(m.chat, {
    react: { text: "🔥", key: m.key }
  }).catch(() => {})

  if (!text) throw `Ejemplo:\n${command} karma police`

  try {
    const search = await fetch(
      `https://api.ryuzei.xyz/search/yts?q=${encodeURIComponent(text)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        }
      }
    )

    const sjson = await search.json()

    if (!sjson.status || !sjson.results?.length)
      throw "No encontré resultados"

    const videoId = sjson.results[0].id

    const dl = await fetch(
      `https://api.ryuzei.xyz/dl/ytmp3?id=${videoId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        }
      }
    )

    const textRaw = await dl.text()

    if (textRaw.startsWith("<"))
      throw "La API devolvió HTML (bloqueo del servidor)"

    const json = JSON.parse(textRaw)

    if (!json.status)
      throw "API status false"

    const info = json.data
    const audio = json.download?.url

    if (!audio)
      throw "No se obtuvo el audio"

    await conn.sendMessage(m.chat, {
      image: { url: info.thumbnail },
      caption: `🎵 ${info.title}\n⏱ ${info.duration}\n👁 ${info.views}`
    }, { quoted: m })

    await conn.sendMessage(m.chat, {
      audio: { url: audio },
      mimetype: "audio/mpeg",
      fileName: `${info.title}.mp3`
    }, { quoted: m })

  } catch (e) {
    await conn.reply(m.chat, `❌ ERROR\n${e}`, m)
  }
}

handler.command = ['play', 'mp3']
export default handler