const SPREADSHEET_ID = '1j4ZCkeaTXelY6yvF1Rfah5-viv6rWhhRv6fO4FzGNG8'
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'
let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

function headers() {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

function rowsToObjects(values) {
  if (!values || values.length < 2) return []
  const [hdrs, ...rows] = values
  return rows
    .map(row => {
      const obj = {}
      hdrs.forEach((h, i) => { obj[h] = row[i] ?? '' })
      return obj
    })
    .filter(obj => hdrs.some(h => obj[h] !== ''))
}

function objectToRow(hdrs, obj) {
  return hdrs.map(h => obj[h] ?? '')
}

export async function list(sheet) {
  const res = await fetch(`${BASE_URL}/${SPREADSHEET_ID}/values/${sheet}`, { headers: headers() })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const data = await res.json()
  return rowsToObjects(data.values)
}

async function getHeaders(sheet) {
  const res = await fetch(`${BASE_URL}/${SPREADSHEET_ID}/values/${sheet}!1:1`, { headers: headers() })
  const data = await res.json()
  return data.values?.[0] ?? []
}

async function nextId(sheet) {
  const rows = await list(sheet)
  if (rows.length === 0) return 1
  const ids = rows.map(r => parseInt(r.Id)).filter(n => !isNaN(n))
  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

// Obtiene el sheetId numérico que necesita batchUpdate/deleteDimension
async function getSheetId(sheetName) {
  const res = await fetch(`${BASE_URL}/${SPREADSHEET_ID}?fields=sheets.properties`, { headers: headers() })
  if (!res.ok) throw new Error(`Error obteniendo metadatos: ${res.status}`)
  const data = await res.json()
  const sheet = data.sheets.find(s => s.properties.title === sheetName)
  if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada`)
  return sheet.properties.sheetId
}

export async function create(sheet, obj) {
  const hdrs = await getHeaders(sheet)
  const id = await nextId(sheet)
  const newObj = { ...obj, Id: String(id) }
  const row = objectToRow(hdrs, newObj)
  await fetch(
    `${BASE_URL}/${SPREADSHEET_ID}/values/${sheet}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', headers: headers(), body: JSON.stringify({ values: [row] }) }
  )
  return newObj
}

export async function update(sheet, id, obj) {
  const hdrs = await getHeaders(sheet)
  const rows = await list(sheet)
  const rowIndex = rows.findIndex(r => String(r.Id) === String(id))
  if (rowIndex === -1) throw new Error(`Registro ${id} no encontrado`)
  const sheetRowNumber = rowIndex + 2
  const updatedObj = { ...rows[rowIndex], ...obj, Id: String(id) }
  const row = objectToRow(hdrs, updatedObj)
  const endCol = String.fromCharCode(64 + hdrs.length)
  await fetch(
    `${BASE_URL}/${SPREADSHEET_ID}/values/${sheet}!A${sheetRowNumber}:${endCol}${sheetRowNumber}?valueInputOption=RAW`,
    { method: 'PUT', headers: headers(), body: JSON.stringify({ values: [row] }) }
  )
  return updatedObj
}

export async function remove(sheet, id) {
  const rows = await list(sheet)
  const rowIndex = rows.findIndex(r => String(r.Id) === String(id))
  if (rowIndex === -1) throw new Error(`Registro ${id} no encontrado`)

  // rowIndex 0 = fila de datos 1 = fila 2 de Sheets (fila 1 es cabecera)
  // startIndex es 0-based: fila de cabecera = 0, primera fila de datos = 1
  const startIndex = rowIndex + 1
  const sheetId = await getSheetId(sheet)

  await fetch(
    `${BASE_URL}/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex,
              endIndex: startIndex + 1,
            }
          }
        }]
      })
    }
  )
}
