import { type Response } from 'supertest'

export const debug = (response: Response) => {
    console.log('-- DEBUG --')
    console.dir({
        status: response.status,
        body: response.body || response.body.message || response.text
    }, {
        depth: null,
        colors: true
    })
    console.log('-----------')
}