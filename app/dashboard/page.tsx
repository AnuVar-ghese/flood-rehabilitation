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
  skills?: string
  availability?: string
  registrationDate?: string
}

interface Camp {
  id: number
  name: string
  beds: number
  originalBeds?: number
  resources: string[]
  contact: string
  ambulance: string
  type: "default" | "volunteer-added"
  addedBy?: string
  addedDate?: string
}

interface VolunteerAssignment {
  id: number
  volunteer: string
  camp: string
  date: string
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [camps, setCamps] = useState<Camp[]>([])
  const [volunteerHistory, setVolunteerHistory] = useState<VolunteerAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      alert("Please login to access the dashboard.")
      router.push("/login")
      return
    }

    if (user.role !== "volunteer") {
      alert("Access denied. This dashboard is for volunteers only.")
      if (user.role === "refugee") {
        router.push("/camps")
      } else {
        router.push("/")
      }
      return
    }

    setCurrentUser(user)
    initializeCamps()
    loadCamps()
    loadVolunteerHistory()
    setIsLoading(false)

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "camps") {
        loadCamps()
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
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

  const initializeCamps = () => {
    const existingCamps = localStorage.getItem("camps")
    if (!existingCamps) {
      const defaultCamps: Camp[] = [
        {
          id: 1,
          name: "Central School Grounds",
          beds: 24,
          originalBeds: 24,
          resources: ["Food", "Water", "Medical Aid", "Blankets"],
          contact: "+91 98765 43210",
          ambulance: "Yes",
          type: "default",
        },
        {
          id: 2,
          name: "Community Hall",
          beds: 12,
          originalBeds: 12,
          resources: ["Food", "Water", "Blankets", "Clothing"],
          contact: "+91 98765 11223",
          ambulance: "Nearby",
          type: "default",
        },
        {
          id: 3,
          name: "Government High School",
          beds: 30,
          originalBeds: 30,
          resources: ["Food", "Water", "First Aid", "Hygiene Kits"],
          contact: "+91 98765 77889",
          ambulance: "Yes",
          type: "default",
        },
      ]
      localStorage.setItem("camps", JSON.stringify(defaultCamps))
    }
  }

  const loadCamps = () => {
    try {
      const campsData = localStorage.getItem("camps")
      if (campsData) {
        setCamps(JSON.parse(campsData))
      }
    } catch (error) {
      console.error("Error loading camps:", error)
    }
  }

  const saveCamps = (campsData: Camp[]) => {
    try {
      localStorage.setItem("camps", JSON.stringify(campsData))
      setCamps(campsData)
      // Trigger storage event for other tabs/windows
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "camps",
          newValue: JSON.stringify(campsData),
        }),
      )
      return true
    } catch (error) {
      console.error("Error saving camps:", error)
      return false
    }
  }

  const loadVolunteerHistory = () => {
    try {
      const assignments = localStorage.getItem("volunteerAssignments")
      const allAssignments = assignments ? JSON.parse(assignments) : []
      const userAssignments = allAssignments.filter((a: VolunteerAssignment) => a.volunteer === currentUser?.name)
      setVolunteerHistory(userAssignments)
    } catch (error) {
      console.error("Error loading volunteer history:", error)
    }
  }

  const saveVolunteerAssignment = (campName: string) => {
    if (!currentUser) return false

    try {
      const assignments = localStorage.getItem("volunteerAssignments")
      const allAssignments = assignments ? JSON.parse(assignments) : []

      const newAssignment: VolunteerAssignment = {
        id: allAssignments.length + 1,
        volunteer: currentUser.name,
        camp: campName,
        date: new Date().toISOString(),
      }

      allAssignments.push(newAssignment)
      localStorage.setItem("volunteerAssignments", JSON.stringify(allAssignments))
      loadVolunteerHistory()
      return true
    } catch (error) {
      console.error("Error saving volunteer assignment:", error)
      return false
    }
  }

  const addActivityLog = (type: string, description: string) => {
    try {
      const logs = localStorage.getItem("adminActivities")
      const allLogs = logs ? JSON.parse(logs) : []

      const newLog = {
        id: Date.now().toString(),
        type,
        description,
        timestamp: new Date().toISOString(),
        user: currentUser?.name || "Unknown",
      }

      allLogs.unshift(newLog)
      // Keep only last 100 activities
      const limitedLogs = allLogs.slice(0, 100)
      localStorage.setItem("adminActivities", JSON.stringify(limitedLogs))
    } catch (error) {
      console.error("Error adding activity log:", error)
    }
  }

  const handleAddCamp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const campName = formData.get("campName") as string
    const campBeds = Number.parseInt(formData.get("campBeds") as string)
    const campResources = (formData.get("campResources") as string)
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0)
    const campContact = formData.get("campContact") as string
    const campAmbulance = formData.get("campAmbulance") as string

    if (!campName || isNaN(campBeds) || campBeds < 0) {
      alert("Please fill in all required fields with valid data.")
      setIsSubmitting(false)
      return
    }

    const newCamp: Camp = {
      id: camps.length ? Math.max(...camps.map((c) => c.id)) + 1 : 1,
      name: campName,
      beds: campBeds,
      originalBeds: campBeds,
      resources: campResources.length > 0 ? campResources : ["Basic supplies"],
      contact: campContact || "",
      ambulance: campAmbulance || "No",
      addedBy: currentUser?.name,
      addedDate: new Date().toISOString(),
      type: "volunteer-added",
    }

    const updatedCamps = [...camps, newCamp]
    if (saveCamps(updatedCamps)) {
      addActivityLog("camp_created", `New camp "${newCamp.name}" was created by volunteer ${currentUser?.name}`)
      alert(`Camp "${newCamp.name}" added successfully! It will now appear on the camps page.`)
      e.currentTarget.reset()
    } else {
      alert("Failed to add camp. Please try again.")
    }

    setIsSubmitting(false)
  }

  const deleteCamp = (campId: number) => {
    const camp = camps.find((c) => c.id === campId)
    if (!camp) return

    if (confirm(`Are you sure you want to remove "${camp.name}"? This action cannot be undone.`)) {
      const updatedCamps = camps.filter((c) => c.id !== campId)
      if (saveCamps(updatedCamps)) {
        addActivityLog("camp_deleted", `Camp "${camp.name}" was removed by volunteer ${currentUser?.name}`)
        alert("Camp removed successfully! Changes will be reflected on the camps page.")
      } else {
        alert("Failed to remove camp. Please try again.")
      }
    }
  }

  const handleVolunteerAssignment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const selectedCampId = formData.get("selectedCamp") as string

    if (!selectedCampId) {
      alert("Please select a camp to volunteer at.")
      return
    }

    const camp = camps.find((c) => c.id === Number.parseInt(selectedCampId))
    if (!camp) return

    if (saveVolunteerAssignment(camp.name)) {
      addActivityLog("volunteer_assignment", `${currentUser?.name} volunteered at ${camp.name}`)
      alert(`Thank you, ${currentUser?.name}, for volunteering at "${camp.name}"!`)
      e.currentTarget.reset()
    } else {
      alert("Failed to save volunteer assignment. Please try again.")
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
          <p className="text-slate-600">Loading dashboard...</p>
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
            {currentUser && (
              <span className="text-sm bg-slate-100 px-3 py-1 rounded-full">👋 Welcome, {currentUser.name}</span>
            )}
            <button onClick={() => router.push("/camps")} className="text-blue-600 hover:text-blue-800 font-medium">
              Relief Camps
            </button>
            <span className="text-blue-600 font-medium">Dashboard</span>
            <button onClick={() => router.push("/profile")} className="text-blue-600 hover:text-blue-800 font-medium">
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-8 text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">📊 Volunteer Dashboard</h1>
          <p className="text-xl text-slate-600">Manage relief camps and coordinate volunteer efforts</p>
        </div>

        {/* User Profile Section */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h3 className="text-2xl font-semibold text-blue-600 mb-4">👤 Volunteer Profile</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>📧 Email:</strong> {currentUser?.email}
              </p>
              <p>
                <strong>📞 Contact:</strong> {currentUser?.contact}
              </p>
              <p>
                <strong>👤 Role:</strong> Volunteer
              </p>
            </div>
            <div>
              {currentUser?.age && (
                <p>
                  <strong>🎂 Age:</strong> {currentUser.age}
                </p>
              )}
              {currentUser?.skills && (
                <p>
                  <strong>🛠️ Skills:</strong> {currentUser.skills}
                </p>
              )}
              {currentUser?.availability && (
                <p>
                  <strong>⏰ Availability:</strong> {currentUser.availability}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">Welcome back, {currentUser?.name}! 👋</h2>
          <div className="space-y-2">
            <p className="text-slate-600">
              Manage relief camps, coordinate volunteer efforts, and make a real difference in our community's recovery.
              Your contributions are essential to helping those affected by the floods.
            </p>
            {currentUser?.registrationDate && (
              <p className="text-sm text-slate-500">
                <strong>📅 Volunteer since:</strong> {new Date(currentUser.registrationDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Available Camps Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">🏕️ Available Relief Camps</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {camps.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No camps available. Add a new camp to get started! 🏕️</p>
              ) : (
                camps.map((camp) => (
                  <div key={camp.id} className="bg-slate-50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-slate-800">🏕️ {camp.name}</h4>
                      <p className="text-sm text-slate-600">
                        <strong>🛏️ Beds Available:</strong> {camp.beds}
                      </p>
                      <p className="text-sm text-slate-600">
                        <strong>📦 Resources:</strong> {camp.resources.join(", ")}
                      </p>
                      {camp.contact && (
                        <p className="text-sm text-slate-600">
                          <strong>📞 Contact:</strong> {camp.contact}
                        </p>
                      )}
                      {camp.addedBy && (
                        <p className="text-sm text-slate-600">
                          <strong>👤 Added by:</strong> {camp.addedBy}
                        </p>
                      )}
                    </div>
                    {camp.type !== "default" && (
                      <button
                        onClick={() => deleteCamp(camp.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add New Camp Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">➕ Add New Relief Camp</h3>
            <form onSubmit={handleAddCamp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">🏷️ Camp Name *</label>
                <input
                  type="text"
                  name="campName"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter camp name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">🛏️ Number of Beds Available *</label>
                <input
                  type="number"
                  name="campBeds"
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter number of beds"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  📦 Available Resources (comma separated)
                </label>
                <textarea
                  name="campResources"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Food, Water, Medical Aid, Blankets, Clothing..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">📞 Emergency Contact</label>
                <input
                  type="tel"
                  name="campContact"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter emergency contact number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">🚑 Ambulance Available</label>
                <select
                  name="campAmbulance"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Nearby">Nearby Hospital</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Adding Camp..." : "🚀 Add Camp"}
              </button>
            </form>
          </div>
        </div>

        {/* Volunteer Assignment Section */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <h3 className="text-xl font-semibold text-blue-600 mb-4 text-center">🤝 Select Camp to Volunteer</h3>
          <p className="text-center text-slate-600 mb-6">
            Choose a relief camp where you'd like to volunteer your time and skills.
          </p>
          <form onSubmit={handleVolunteerAssignment} className="max-w-md mx-auto">
            <div className="space-y-3 mb-6">
              {camps.length === 0 ? (
                <p className="text-center text-slate-500">No camps available for volunteering.</p>
              ) : (
                camps.map((camp) => (
                  <label
                    key={camp.id}
                    className="flex items-center p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <input type="radio" name="selectedCamp" value={camp.id} className="mr-3" required />
                    <span>
                      🏕️ {camp.name} ({camp.beds} beds available)
                    </span>
                  </label>
                ))
              )}
            </div>
            {camps.length > 0 && (
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ✅ Confirm Volunteering
              </button>
            )}
          </form>
        </div>

        {/* Volunteer History Section */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">📋 Your Volunteer History</h3>
          <p className="text-slate-600 mb-6">
            Track your volunteer contributions and see the impact you've made in the community.
          </p>
          <div className="space-y-4">
            {volunteerHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">
                  No volunteer history yet. Select a camp above to start volunteering! 🤝
                </p>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>💡 Note:</strong> Your volunteer history is automatically saved and will be restored when
                    you log in again.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
                  <p className="text-green-800 text-sm">
                    <strong>🎉 Great work!</strong> You have volunteered at {volunteerHistory.length} camp
                    {volunteerHistory.length !== 1 ? "s" : ""}. Your contributions are making a real difference!
                  </p>
                </div>
                {volunteerHistory
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((assignment, index) => (
                    <div key={assignment.id} className="bg-slate-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">🏕️ {assignment.camp}</h4>
                          <div className="space-y-1 text-sm text-slate-600 mt-2">
                            <p>
                              <strong>📅 Volunteer Date:</strong> {new Date(assignment.date).toLocaleDateString()}
                            </p>
                            <p>
                              <strong>⏰ Time:</strong> {new Date(assignment.date).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          #{volunteerHistory.length - index}
                        </span>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
