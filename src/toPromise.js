function toPromise(func) {
    return new Promise((resolve, reject) => {
        try {
            func((err, res) => {
                if (err) {
                    return reject(err)
                }

                return resolve(res)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

module.exports = toPromise
