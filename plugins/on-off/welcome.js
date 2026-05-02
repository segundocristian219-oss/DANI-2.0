const ppCache = new Map()
const CACHE_TTL = 60000

async function getProfilePic(conn, jid) {
  const cached = ppCache.get(jid)
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.url

  let url = 'https://cdn.russellxz.click/262f94ad.jpeg'
  try {
    url = await conn.profilePictureUrl(jid, 'image')
  } catch {
    try {
      url = await conn.profilePictureUrl(jid, 'preview')
    } catch {}
  }

  ppCache.set(jid, { url, time: Date.now() })

  if (ppCache.size > 500) {
    for (const [k, v] of ppCache) {
      if (Date.now() - v.time > CACHE_TTL) ppCache.delete(k)
    }
  }

  return url
}

function parseText(text, data) {
  return text.replace(/@user|@group|@desc/g, m =>
    m === '@user' ? data.user :
    m === '@group' ? data.group :
    data.desc
  )
}

async function sendEvent(conn, chatId, jid, text) {
  try {
    console.log("SEND_EVENT_START", { chatId, jid })

    const pic = await getProfilePic(conn, jid)

    await conn.sendMessage(chatId, {
      image: { url: pic },
      caption: text,
      mentions: [jid]
    })

    console.log("SEND_EVENT_SUCCESS")
  } catch (e) {
    console.log("SEND_EVENT_ERROR", e)
  }
}

export default function setupWelcome(conn) {
  console.log("WELCOME_SYSTEM_INIT")

  conn.ev.on('group-participants.update', async (update) => {
    try {
      console.log("EVENT_RECEIVED", update)

      const { id, participants, action } = update

      console.log("GROUP_ID:", id)
      console.log("PARTICIPANTS:", participants)
      console.log("ACTION:", action)

      const chat = global.db.data.chats[id]
      console.log("CHAT_EXISTS:", !!chat)
      console.log("WELCOME_ENABLED:", chat?.welcome)

      if (!chat || !chat.welcome) return

      let groupMetadata = {}
      try {
        groupMetadata = await conn.groupMetadata(id)
      } catch (e) {
        console.log("METADATA_ERROR", e)
      }

      const groupName = groupMetadata?.subject || 'Grupo'
      const groupDesc = groupMetadata?.desc || 'Sin descripción'

      const byeMsgs = [
`*╭┈┈┈┈┈┈┈┈┈┈┈┈┈≫*
*┊* @user
*┊𝗧𝗨 𝗔𝗨𝗦𝗘𝗡𝗖𝗜𝗔 𝗙𝗨𝗘 𝗖𝗢𝗠𝗢 𝗨𝗡 𝗤𝗟𝗢*
*┊𝗖𝗢𝗡 𝗢𝗟𝗢𝗥 𝗔 𝗠𝗥𝗗* 👿
*╰┈┈┈┈┈┈┈┈┈┈┈┈┈≫*`,
`*╭┈┈┈┈┈┈┈┈┈┈┈┈┈≫*
*┊* @user
*┊𝗔𝗟𝗚𝗨𝗜𝗘𝗡 𝗠𝗘𝗡𝗢𝗦*
*┊𝗡𝗔𝗗𝗜𝗘 𝗧𝗘 𝗩𝗔 𝗔 𝗘𝗫𝗧𝗥𝗔𝗡̃𝗔𝗥* 👿
*╰┈┈┈┈┈┈┈┈┈┈┈┈┈≫*`
      ]

      for (const jid of participants) {
        console.log("PROCESSING:", jid)

        const user = `@${jid.split('@')[0]}`
        const data = { user, group: groupName, desc: groupDesc }

        if (action === 'add') {
          console.log("JOIN_DETECTED")

          const text = chat.sWelcome
            ? parseText(chat.sWelcome, data)
            : `┊» 𝙋𝙊𝙍 𝙁𝙄𝙉 𝙇𝙇𝙀𝗚𝗔𝗦
┊» ${groupName}
┊» ${user}
┊» 𝗹𝗲𝗲 𝗹𝗮 𝗱𝗲𝘀𝗰𝗿𝗶𝗽𝗰𝗶𝗼𝗻

» Siéntete como en tu casa`

          await sendEvent(conn, id, jid, text)
        }

        if (action === 'remove') {
          console.log("LEAVE_DETECTED")

          const text = chat.sBye
            ? parseText(chat.sBye, data)
            : parseText(byeMsgs[Math.floor(Math.random() * byeMsgs.length)], data)

          await sendEvent(conn, id, jid, text)
        }
      }

      console.log("EVENT_DONE")
    } catch (err) {
      console.log("WELCOME_FATAL_ERROR", err)
    }
  })
}