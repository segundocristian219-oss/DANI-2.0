import fetch from 'node-fetch'
import yts from 'yt-search'

const APIKEY = 'c50919b9828c357cd81e753f03d4c000'

const handler = async (m, { conn, args }) => {

  const text = args.join(' ')

  if (!text)
    return m.reply(`🪐 Ingresa un texto o link de YouTube
Ejemplo: *play autos edits*`)

  let video
  const isLink = text.includes('youtube.com') || text.includes('youtu.be')

  try {

    let stage = 'yt-search'

    if (isLink) {

      const id =
        text.split('v=')[1]?.split('&')[0] ||
        text.split('/').pop()

      const res = await yts({ videoId: id })
      video = res

    } else {

      const res = await yts(text)
      video = res.videos[0]

    }

    if (!video)
      throw new Error('Video no encontrado')

    await conn.sendMessage(
      m.chat,
      { text: `🪐 Descargando audio de *${video.title}*...` },
      { quoted: m }
    )

    stage = 'api-request'

    const apiURL =
      `https://optishield.uk/api/?type=youtubedl` +
      `&apikey=${APIKEY}` +
      `&url=${encodeURIComponent(video.url)}` +
      `&video=0`

    const apiRes = await fetch(apiURL)

    stage = 'api-response'

    if (!apiRes.ok)
      throw new Error(`HTTP ${apiRes.status}`)

    const raw = await apiRes.text()

    let json

    try {
      json = JSON.parse(raw)
    } catch {
      throw new Error(`La API devolvió HTML o texto:\n${raw.slice(0,300)}`)
    }

    stage = 'json-check'

    if (!json?.result?.download) {
      throw new Error(
`La API respondió pero no devolvió download

Respuesta API:
${JSON.stringify(json,null,2).slice(0,400)}`
      )
    }

    stage = 'send-audio'

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: json.result.download },
        mimetype: 'audio/mpeg',
        fileName: `${video.title}.mp3`
      },
      { quoted: m }
    )

  } catch (e) {

    const debug =
`🌱 Error en comando play

Etapa: ${e.stage || 'desconocida'}

Mensaje:
${e.message || e}

Stack:
${(e.stack || '').slice(0,500)}
`

    await conn.sendMessage(
      m.chat,
      { text: debug },
      { quoted: m }
    )

  }

}

handler.command = ['play','musicdl']
handler.help = ['play <texto|url>']
handler.tags = ['descargas']

export default handler