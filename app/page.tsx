"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  name: string
  email: string
  role: "refugee" | "volunteer"
  contact: string
  age?: number
  address?: string
  needs?: string
  skills?: string
  availability?: string
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showSignup, setShowSignup] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"refugee" | "volunteer">("refugee")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
  }, [])

  const getCurrentUser = (): User | null => {
    try {
      const userData = localStorage.getItem("currentUser")
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error("Error loading user data:", error)
      return null
    }
  }

  const setCurrentUserData = (userData: User) => {
    try {
      localStorage.setItem("currentUser", JSON.stringify(userData))
      setCurrentUser(userData)
      return true
    } catch (error) {
      console.error("Error saving user data:", error)
      return false
    }
  }

  const handleCampsAccess = () => {
    if (!currentUser) {
      alert("Please login or register to access relief camps information.")
      return
    }
    router.push("/camps")
  }

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("currentUser")
      setCurrentUser(null)
      setShowSignup(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as any

    // Validate required fields
    const requiredFields =
      selectedRole === "refugee"
        ? ["name", "age", "email", "contact", "password", "address", "needs"]
        : ["name", "age", "email", "contact", "password", "skills", "availability"]

    const missingFields = requiredFields.filter((field) => !data[field])
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(", ")}`)
      setIsLoading(false)
      return
    }

    if (selectedRole === "volunteer" && Number.parseInt(data.age) < 18) {
      alert("Volunteers must be at least 18 years old.")
      setIsLoading(false)
      return
    }

    // Check if user already exists
    const existingUsers = getStoredUsers()
    if (existingUsers.find((user) => user.email === data.email)) {
      alert("An account with this email already exists. Please login instead.")
      setIsLoading(false)
      return
    }

    // Store complete user data including credentials
    const userData: User & { password: string } = {
      ...data,
      role: selectedRole,
      registrationDate: new Date().toISOString(),
    }

    if (storeUserCredentials(userData)) {
      // Set current user (without password)
      const { password, ...userDataToStore } = userData
      if (setCurrentUserData(userDataToStore)) {
        alert(`${selectedRole === "refugee" ? "Registration" : "Volunteer application"} successful!`)

        setTimeout(() => {
          if (selectedRole === "volunteer") {
            router.push("/dashboard")
          } else {
            router.push("/camps")
          }
        }, 1000)
      } else {
        alert("Registration failed. Please try again.")
      }
    } else {
      alert("Registration failed. Please try again.")
    }

    setIsLoading(false)
  }

  // Add these helper functions before the return statement:
  const getStoredUsers = () => {
    try {
      const users = localStorage.getItem("registeredUsers")
      return users ? JSON.parse(users) : []
    } catch (error) {
      console.error("Error loading stored users:", error)
      return []
    }
  }

  const storeUserCredentials = (userData: User & { password: string }) => {
    try {
      const existingUsers = getStoredUsers()
      existingUsers.push(userData)
      localStorage.setItem("registeredUsers", JSON.stringify(existingUsers))
      return true
    } catch (error) {
      console.error("Error storing user credentials:", error)
      return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent cursor-pointer">
            🌊 Flood Rehabilitation Project
          </h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              Home
            </a>
            {currentUser && (
              <span className="text-sm bg-slate-100 px-3 py-1 rounded-full">👋 Welcome, {currentUser.name}</span>
            )}
            <button onClick={handleCampsAccess} className="text-blue-600 hover:text-blue-800 font-medium">
              Relief Camps
            </button>
            {currentUser && (
              <button onClick={() => router.push("/profile")} className="text-blue-600 hover:text-blue-800 font-medium">
                Profile
              </button>
            )}
            {currentUser?.role === "volunteer" && (
              <button
                onClick={() => router.push("/dashboard")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Dashboard
              </button>
            )}
            {!currentUser ? (
              <>
                <button onClick={() => router.push("/login")} className="text-blue-600 hover:text-blue-800 font-medium">
                  Login
                </button>
                <button
                  onClick={() => setShowSignup(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </nav>
      </header>

      {!showSignup ? (
        /* Landing Section */
        <main>
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-blue-100 to-blue-200 py-20">
            <div className="max-w-6xl mx-auto px-4 text-center">
              <h2 className="text-5xl font-bold text-slate-800 mb-6">
                🤝 Emergency Flood Relief & Rehabilitation Services
              </h2>
              <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
                Coordinating community support and resources for comprehensive flood recovery efforts
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                {!currentUser ? (
                  <>
                    <button
                      onClick={() => router.push("/login")}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      🔐 Access Portal
                    </button>
                    <button
                      onClick={() => setShowSignup(true)}
                      className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      ✨ Register for Services
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCampsAccess}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      🏕️ View Relief Camps
                    </button>
                    {currentUser.role === "volunteer" && (
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        📊 Access Dashboard
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Services Section */}
          <section className="py-20">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-4xl font-bold text-center text-slate-800 mb-12">🌟 Our Services</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-2xl font-semibold text-blue-600 mb-4">🆘 Emergency Assistance</h3>
                  <p className="text-slate-600">
                    If you have been affected by flooding and require immediate assistance, register to access available
                    relief camps, emergency shelter, and essential resources.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-2xl font-semibold text-blue-600 mb-4">🤝 Volunteer Services</h3>
                  <p className="text-slate-600">
                    Join our volunteer network to help coordinate relief efforts, manage emergency shelters, and provide
                    support to community members in need.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-2xl font-semibold text-blue-600 mb-4">🏕️ Relief Camps</h3>
                  <p className="text-slate-600">
                    Access comprehensive information about available relief camps including capacity, available
                    resources, medical facilities, and essential supplies.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* Signup Section */
        <main className="py-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">🎯 Service Registration</h2>
                <p className="text-slate-600 mb-6">Please select the type of service you require to get started:</p>
                <div className="flex gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("refugee")}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedRole === "refugee"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    🆘 Request Assistance
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("volunteer")}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedRole === "volunteer"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    🤝 Volunteer Services
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">👤 Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">🎂 Age *</label>
                    <input
                      type="number"
                      name="age"
                      required
                      min={selectedRole === "volunteer" ? 18 : 1}
                      max="120"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={selectedRole === "volunteer" ? "Enter your age (18+)" : "Enter your age"}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">📧 Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">📞 Contact Number *</label>
                    <input
                      type="tel"
                      name="contact"
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">🔒 Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Create a secure password"
                  />
                </div>

                {selectedRole === "refugee" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        📍 Current Location / Address *
                      </label>
                      <textarea
                        name="address"
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Provide your current location or address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">📝 Assistance Required *</label>
                      <textarea
                        name="needs"
                        required
                        rows={4}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Please describe the type of assistance you need"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">🛠️ Skills and Experience *</label>
                      <textarea
                        name="skills"
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your relevant skills and experience"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">⏰ Availability *</label>
                      <textarea
                        name="availability"
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Please specify your availability (days, hours, duration)"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Processing..." : "🚀 Submit Registration"}
                </button>
              </form>

              <div className="text-center mt-6">
                <button onClick={() => setShowSignup(false)} className="text-blue-600 hover:text-blue-800 font-medium">
                  ← Return to Home
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
