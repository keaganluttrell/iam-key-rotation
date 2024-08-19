export default class Logger {
  constructor () {
    this.logs = [`Log entries for ${new Date()}`]
  }

  addLog (user, action, msg) {
    const logEntry = `${user} ${action} ${msg}`
    this.logs.push(logEntry)
  }

  getLogs () {
    return this.logs
  }

  print () {
    console.log(this.logs.join('\n'))
  }

  clearLogs () {
    this.logs = [`Log entries for ${new Date()}`]
  }
}
