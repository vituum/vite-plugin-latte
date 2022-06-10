import * as childProcess from 'child_process'
import * as fs from 'fs'
const start = new Date()

const execSync = (cmd) => {
    try {
        return {
            output: childProcess.execSync(cmd).toString()
        }
    } catch ({ output }) {
        return {
            error: true,
            output: output[1].toString()
        }
    }
}

const latte = execSync('php index.php')

if (latte.error) {
    console.error(latte.output)
    process.exit(1)
}

fs.writeFileSync('index.html', latte.output)

console.info('\x1b[34m', 'index.html', '\x1b[33m', `${new Date() - start}ms`, '\x1b[0m')
