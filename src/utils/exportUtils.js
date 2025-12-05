/**
 * 将对话消息导出为 Markdown 格式
 * @param {Array} messages - 消息数组
 * @param {string} sessionName - 会话名称
 */
export const exportToMarkdown = (messages, sessionName = 'chat-history') => {
  if (!messages || messages.length === 0) return

  let content = `# ${sessionName}\n\n`
  content += `导出时间: ${new Date().toLocaleString()}\n\n---\n\n`

  messages.forEach(msg => {
    const role = msg.role === 'user' ? 'User' : 'AI'
    const timestamp = new Date(msg.timestamp).toLocaleString()
    
    content += `### ${role} (${timestamp})\n\n`
    
    // 处理图片
    if (msg.images && msg.images.length > 0) {
      msg.images.forEach((img, index) => {
        content += `![Image ${index + 1}](${img})\n\n`
      })
    }

    content += `${msg.content}\n\n`
    content += `---\n\n`
  })

  // 创建 Blob 对象
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  
  // 创建下载链接
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sessionName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.md`
  
  // 触发下载
  document.body.appendChild(link)
  link.click()
  
  // 清理
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 将对话消息导出为 JSON 格式
 * @param {Array} messages - 消息数组
 * @param {string} sessionName - 会话名称
 */
export const exportToJson = (messages, sessionName = 'chat-history') => {
  if (!messages || messages.length === 0) return

  const data = {
    title: sessionName,
    exportedAt: new Date().toISOString(),
    messages: messages
  }

  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sessionName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
  
  document.body.appendChild(link)
  link.click()
  
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
