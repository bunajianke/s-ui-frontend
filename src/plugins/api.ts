import axios from 'axios'

// X-Requested-With matters beyond convention now -- the server treats it as
// the marker that tells its own XHR apart from a cross-site form post.
const api = axios.create({
    baseURL: "./",
    headers: {
        common: { 'X-Requested-With': 'XMLHttpRequest' },
        post: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    },
})

api.interceptors.request.use(
    (config) => {
        // Read requests are coalesced in HttpUtils. Never cancel a mutation
        // because another request has the same URL: their bodies can differ,
        // and aborting the browser request cannot undo a server-side write.
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data'
        }
        return config
    },
    (error) => Promise.reject(error),
)

export default api
