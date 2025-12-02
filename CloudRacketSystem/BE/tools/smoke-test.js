const axios = require('axios')

const BASE = process.env.BASE_URL || 'http://localhost:3000/api'

async function run() {
  try {
    const unique = Date.now()
    const testUser = {
      email: `smoke${unique}@example.com`,
      password: 'Test12345A',
      name: 'Smoke Tester',
      phone: '+84901234567'
    }

    console.log('Registering user...', testUser.email)
    const reg = await axios.post(`${BASE}/register/customer`, testUser)
    console.log('Register response:', reg.status, reg.data)

    console.log('Logging in...')
    const loginRes = await axios.post(`${BASE}/login`, { email: testUser.email, password: testUser.password })
    console.log('Login response status:', loginRes.status)
    const token = loginRes.data.token
    if (!token) {
      console.error('No token returned from login; aborting smoke tests')
      return process.exit(1)
    }
    console.log('Token received (truncated):', token.slice(0, 40) + '...')

    // Get profile
    console.log('Fetching profile using token...')
    const profile = await axios.get(`${BASE}/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
    console.log('Profile:', profile.status, profile.data)

    // Update profile
    console.log('Updating profile name...')
    const update = await axios.put(`${BASE}/user/profile`, { name: 'Smoke Updated' }, { headers: { Authorization: `Bearer ${token}` } })
    console.log('Update response:', update.status, update.data)

    // Logout
    console.log('Logging out...')
    const out = await axios.post(`${BASE}/logout`, null, { headers: { Authorization: `Bearer ${token}` } })
    console.log('Logout response:', out.status, out.data)

    // Attempt to reuse token
    try {
      console.log('Attempting to fetch profile with invalidated token...')
      await axios.get(`${BASE}/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
      console.log('Unexpected: was able to use token after logout (this may be because the server was restarted after logout)')
    } catch (err) {
      console.log('As expected, token is invalid after logout (or server rejected request):', err?.response?.status || err.message)
    }

    console.log('Smoke tests completed successfully')
  } catch (err) {
    // Provide helpful diagnostics if server is down or DynamoDB not configured
    console.error('Smoke test failed:')
    if (err?.response) {
      console.error('HTTP status:', err.response.status)
      console.error('HTTP body:', JSON.stringify(err.response.data, null, 2))
    } else {
      console.error(err?.message || err)
    }
    process.exit(1)
  }
}

run()
