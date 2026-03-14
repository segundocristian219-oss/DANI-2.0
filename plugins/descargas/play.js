const handler = async (m, { conn, text, command }) => {

  await conn.sendMessage(m.chat, {
    react: { text: "🔥", key: m.key }
  }).catch(() => {})

  if (!text) throw `Ejemplo:\n${command} karma police`

  try {

    await conn.reply(m.chat, "🔎 Buscando en YouTube...", m)

    const search = await fetch(`https://api.ryuzei.xyz/search/yt?q=${encodeURIComponent(text)}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    })

    const searchJson = await search.json()

    if (!searchJson.status || !searchJson.data?.length)
      throw "No encontré resultados"

    const video = searchJson.data[0]
    const videoUrl = video.url

    await conn.reply(m.chat, `🎵 Encontrado:\n${video.title}`, m)

    const dl = await fetch(`https://api.ryuzei.xyz/dl/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    })

    const json = await dl.json()

    if (!json.status) throw "Error al convertir a mp3"

    const info = json.data
    const audio = json.download.url

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

  } catch (err) {
    await conn.reply(m.chat, `❌ ERROR\n${err}`, m)
  }
}

handler.command = ['play','mp3']

export default handler