export function exportToCSV(data, filename, columns) {
  if (!data || !data.length) {
    alert('沒有資料可匯出')
    return
  }

  const headers = columns.map(c => c.label).join(',')

  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? ''
      return String(val).includes(',') || String(val).includes('\n')
        ? `"${val}"`
        : val
    }).join(',')
  )

  const csv = [headers, ...rows].join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}