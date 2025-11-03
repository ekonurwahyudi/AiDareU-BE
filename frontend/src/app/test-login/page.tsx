'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function TestLogin() {
  const [email, setEmail] = useState('generasic@gmail.com')
  const [password, setPassword] = useState('Siomera0813!')
  const [result, setResult] = useState<any>(null)

  const handleTest = async () => {
    console.log('Testing login with:', { email })
    
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false
      })
      
      console.log('SignIn result:', res)
      setResult(res)
    } catch (error) {
      console.error('SignIn error:', error)
      setResult({ error: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <div className="p-8">
      <h1>Test NextAuth Login</h1>
      
      <div className="mb-4">
        <label>Email:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 ml-2"
        />
      </div>
      
      <div className="mb-4">
        <label>Password:</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 ml-2"
        />
      </div>
      
      <button 
        onClick={handleTest}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Login
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100">
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}