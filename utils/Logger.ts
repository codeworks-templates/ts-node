export class Logger {
  tag: string
  constructor(tag = '') {
    this.tag = tag
  }

  get prefix() {
    return `${new Date().toLocaleTimeString('en-US')}${this.tag ? '::[' + this.tag + ']' : ''}`
  }

  _print(method, args) {
    if (process.env.NODE_ENV === 'dev') {
      console[method](this.prefix, ...args)
    } else {
      switch (method) {
        case 'log':
        case 'debug':
          return
      }
      console[method](this.prefix, ...args)
    }
  }

  log(...args: any) {
    this._print('log', arguments)
  }

  trace(...args: any) {
    this._print('trace', arguments)
  }

  debug(...args: any) {
    this._print('debug', arguments)
  }

  info(...args: any) {
    this._print('info', arguments)
  }

  warn(...args: any) {
    this._print('warn', arguments)
  }

  error(...args: any) {
    this._print('error', arguments)
  }
}

export const logger = new Logger()