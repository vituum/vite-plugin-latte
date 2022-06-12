import { extname } from 'path'
import * as childProcess from 'child_process'

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

const renderTemplate = (path, config) => {
    return execSync(`php index.php ${path} ${JSON.stringify(config)}`)
}

const latte = (config) => {
    return {
        name: 'vite-plugin-latte',
        transformIndexHtml: {
            enforce: 'pre',
            async transform(content, { path, server }) {
                const renderLatte = renderTemplate(path, JSON.stringify(config))

                if (renderLatte.error) {
                    server.ws.send({
                        type: 'error',
                        err: {
                            message: renderLatte.output,
                            plugin: 'vite-plugin-latte'
                        }
                    })

                    return
                }

                return renderLatte.output
            }
        },
        handleHotUpdate({ file, server }) {
            if (extname(file) === '.latte') {
                server.ws.send({ type: 'full-reload' })
            }
        }
    }
}

export default latte
