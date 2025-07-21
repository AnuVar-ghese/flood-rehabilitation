"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  name: string
  email: string
  role: "refugee" | "volunteer"
  contact: string
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = getCurrentUser()
    if (currentUser) {
      alert(`Welcome back, ${currentUser.name}!`)
      setTimeout(() => {
        if (currentUser.role === "volunteer") {
          router.push("/dashboard")
        } else {
          router.push("/camps")
        }
      }, 1000)
    }
  }, [router])

  const getCurrentUser = (): User | null => {
    try {
      const userData = localStorage.getItem("currentUser")
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error("Error loading user data:", error)
      return null
    }
  }

  const setCurrentUser = (userData: Omit<User, "password">) => {
    try {
      localStorage.setItem("currentUser", JSON.stringify(userData))
      return true
    } catch (error) {
      console.error("Error saving user data:", error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      alert("Please fill in all fields")
      setIsLoading(false)
      return
    }

    // Get stored users and validate credentials
    const storedUsers = getStoredUsers()
    const user = storedUsers.find((u) => u.email === email && u.password === password)

    if (!user) {
      alert("Invalid email or password. Please check your credentials and try again.")
      setIsLoading(false)
      return
    }

    // Remove password from user data before storing as current user
    const { password: _, ...userDataWithoutPassword } = user

    if (setCurrentUser(userDataWithoutPassword)) {
      alert(`Welcome back, ${user.name}!`)

      // Restore user's previous state based on role
      setTimeout(() => {
        if (user.role === "volunteer") {
          router.push("/dashboard")
        } else {
          router.push("/camps")
        }
      }, 1000)
    } else {
      alert("Login failed. Please try again.")
    }

    setIsLoading(false)
  }

  const getStoredUsers = () => {
    try {
      const users = localStorage.getItem("registeredUsers")
      return users ? JSON.parse(users) : []
    } catch (error) {
      console.error("Error loading stored users:", error)
      return []
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Login</h1>
          <p className="text-slate-600">Enter your credentials to access the platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-slate-600">Forgot your password? Contact support for assistance.</p>
          <p>
            Don't have an account?{" "}
            <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up here
            </button>
          </p>
          <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
