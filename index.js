import child_process from 'child_process'
import * as fs from 'fs'
const start = new Date();

const execSync = (cmd) => {
  try {
    return {
      output: child_process.execSync(cmd).toString()
    }
  } catch({ output }) {
    return {
      error: true,
      output: output[1].toString()
    }
  }
}

const latte = execSync(`php index.php`)

if (latte.error) {
  console.error(latte.output)
  process.exit(1)
}


fs.writeFileSync('index.html', latte.output)

setTimeout(() => console.info("\x1b[34m", `processed in`, "\x1b[33m", `${new Date() - start}ms`, "\x1b[0m"), 1);
