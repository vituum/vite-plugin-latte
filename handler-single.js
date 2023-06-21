let params = JSON.parse(process.argv[3])
const path = process.argv[2]

params = params.map(value => Buffer.from(value, 'base64').toString('utf-8'))

const output = (await import([path])).default(...params)

if (output) {
    console.log(Buffer.from(output.toString(), 'utf-8').toString('base64'))
}
