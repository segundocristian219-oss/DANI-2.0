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
          "Accept": "application/json",
          "Referer": "https://youtube.com/"
        }
      }
    )

    const sjson = await search.json()

    if (!sjson.status || !sjson.results?.length)
      throw "No encontré resultados"

    const video = sjson.results[0]

    const dl = await fetch(
      `https://api.ryuzei.xyz/dl/ytmp3?url=${encodeURIComponent(video.url)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
          "Referer": "https://youtube.com/"
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
      caption: `🎵 ${info.title}
⏱ ${info.duration}
👁 ${info.views}`
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

handler.command = ['play','mp3']
export default handler