"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  registrationDate?: string
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      alert("Please login to access your profile.")
      router.push("/login")
      return
    }
    setCurrentUser(user)
    setIsLoading(false)
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

  const updateUserProfile = (updatedData: Partial<User>) => {
    if (!currentUser) return false

    try {
      // Update current user
      const updatedUser = { ...currentUser, ...updatedData }
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))

      // Update stored users
      const storedUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const userIndex = storedUsers.findIndex((u: any) => u.email === currentUser.email)
      if (userIndex !== -1) {
        storedUsers[userIndex] = { ...storedUsers[userIndex], ...updatedData }
        localStorage.setItem("registeredUsers", JSON.stringify(storedUsers))
      }

      setCurrentUser(updatedUser)
      return true
    } catch (error) {
      console.error("Error updating user profile:", error)
      return false
    }
  }

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const updatedData = Object.fromEntries(formData.entries()) as any

    if (updateUserProfile(updatedData)) {
      alert("Profile updated successfully!")
      setIsEditing(false)
    } else {
      alert("Failed to update profile. Please try again.")
    }
  }

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("currentUser")
      router.push("/")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1
            onClick={() => router.push("/")}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent cursor-pointer"
          >
            🌊 Flood Rehabilitation Project
          </h1>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 font-medium">
              Home
            </button>
            <button onClick={() => router.push("/camps")} className="text-blue-600 hover:text-blue-800 font-medium">
              Relief Camps
            </button>
            {currentUser?.role === "volunteer" && (
              <button
                onClick={() => router.push("/dashboard")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Dashboard
              </button>
            )}
            <span className="text-blue-600 font-medium">Profile</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-8 text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">👤 Your Profile</h1>
          <p className="text-xl text-slate-600">Manage your account information and preferences</p>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-600">Profile Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isEditing ? "bg-gray-600 text-white hover:bg-gray-700" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isEditing ? "Cancel" : "✏️ Edit Profile"}
            </button>
          </div>

          {!isEditing ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <p className="text-lg text-slate-800">{currentUser?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <p className="text-lg text-slate-800">{currentUser?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                  <p className="text-lg text-slate-800">{currentUser?.contact}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <p className="text-lg text-slate-800 capitalize">
                    {currentUser?.role === "refugee" ? "Relief Seeker" : "Volunteer"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {currentUser?.age && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                    <p className="text-lg text-slate-800">{currentUser.age}</p>
                  </div>
                )}
                {currentUser?.address && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <p className="text-lg text-slate-800">{currentUser.address}</p>
                  </div>
                )}
                {currentUser?.needs && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assistance Needed</label>
                    <p className="text-lg text-slate-800">{currentUser.needs}</p>
                  </div>
                )}
                {currentUser?.skills && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Skills</label>
                    <p className="text-lg text-slate-800">{currentUser.skills}</p>
                  </div>
                )}
                {currentUser?.availability && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
                    <p className="text-lg text-slate-800">{currentUser.availability}</p>
                  </div>
                )}
                {currentUser?.registrationDate && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Member Since</label>
                    <p className="text-lg text-slate-800">
                      {new Date(currentUser.registrationDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={currentUser?.name}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                  <input
                    type="tel"
                    name="contact"
                    defaultValue={currentUser?.contact}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {currentUser?.age && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    defaultValue={currentUser.age}
                    min="1"
                    max="120"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {currentUser?.address && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    defaultValue={currentUser.address}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {currentUser?.needs && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assistance Needed</label>
                  <textarea
                    name="needs"
                    defaultValue={currentUser.needs}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {currentUser?.skills && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Skills</label>
                  <textarea
                    name="skills"
                    defaultValue={currentUser.skills}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {currentUser?.availability && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
                  <textarea
                    name="availability"
                    defaultValue={currentUser.availability}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💾 Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
