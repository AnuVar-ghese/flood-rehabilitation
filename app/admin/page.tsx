"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  name: string
  email: string
  role: "refugee" | "volunteer" | "admin"
  contact: string
  age?: number
  address?: string
  needs?: string
  skills?: string
  availability?: string
  registrationDate?: string
}

interface Camp {
  id: number
  name: string
  beds: number
  originalBeds: number
  resources: string[]
  contact: string
  ambulance: string
  type: "default" | "volunteer-added"
  addedBy?: string
  addedDate?: string
}

interface CampSelection {
  campId: number
  campName: string
  selectedDate: string
  userName: string
}

interface VolunteerAssignment {
  id: number
  volunteer: string
  camp: string
  date: string
}

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
  user?: string
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [users, setUsers] = useState<(User & { password: string })[]>([])
  const [camps, setCamps] = useState<Camp[]>([])
  const [campSelections, setCampSelections] = useState<Record<string, CampSelection>>({})
  const [volunteerAssignments, setVolunteerAssignments] = useState<VolunteerAssignment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddCamp, setShowAddCamp] = useState(false)
  const [newUserRole, setNewUserRole] = useState<"refugee" | "volunteer">("refugee")
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      alert("Access denied. Admin privileges required.")
      router.push("/login")
      return
    }

    setCurrentUser(user)
    loadAllData()
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

  const loadAllData = () => {
    loadUsers()
    loadCamps()
    loadCampSelections()
    loadVolunteerAssignments()
    loadActivities()
  }

  const loadUsers = () => {
    try {
      const userData = localStorage.getItem("registeredUsers")
      setUsers(userData ? JSON.parse(userData) : [])
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const loadCamps = () => {
    try {
      const campsData = localStorage.getItem("camps")
      if (campsData) {
        setCamps(JSON.parse(campsData))
      } else {
        // Initialize default camps if none exist
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
        setCamps(defaultCamps)
      }
    } catch (error) {
      console.error("Error loading camps:", error)
    }
  }

  const loadCampSelections = () => {
    try {
      const selectionsData = localStorage.getItem("campSelections")
      setCampSelections(selectionsData ? JSON.parse(selectionsData) : {})
    } catch (error) {
      console.error("Error loading camp selections:", error)
    }
  }

  const loadVolunteerAssignments = () => {
    try {
      const assignmentsData = localStorage.getItem("volunteerAssignments")
      setVolunteerAssignments(assignmentsData ? JSON.parse(assignmentsData) : [])
    } catch (error) {
      console.error("Error loading volunteer assignments:", error)
    }
  }

  const loadActivities = () => {
    try {
      const activitiesData = localStorage.getItem("adminActivities")
      setActivities(activitiesData ? JSON.parse(activitiesData) : [])
    } catch (error) {
      console.error("Error loading activities:", error)
    }
  }

  const addActivity = (type: string, description: string, user?: string) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      type,
      description,
      timestamp: new Date().toISOString(),
      user,
    }

    try {
      const existingActivities = localStorage.getItem("adminActivities")
      const activities = existingActivities ? JSON.parse(existingActivities) : []
      activities.unshift(newActivity)

      // Keep only last 100 activities
      const limitedActivities = activities.slice(0, 100)
      localStorage.setItem("adminActivities", JSON.stringify(limitedActivities))
      setActivities(limitedActivities)
    } catch (error) {
      console.error("Error saving activity:", error)
    }
  }

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("currentUser")
      router.push("/")
    }
  }

  const handleDeleteUser = (userEmail: string) => {
    const user = users.find((u) => u.email === userEmail)
    if (!user) return

    if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      try {
        // Remove user from users list
        const updatedUsers = users.filter((u) => u.email !== userEmail)
        localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))
        setUsers(updatedUsers)

        // Remove user's camp selection and restore bed count
        const userSelection = campSelections[userEmail]
        if (userSelection) {
          const updatedCamps = camps.map((camp) =>
            camp.id === userSelection.campId ? { ...camp, beds: camp.beds + 1 } : camp,
          )
          localStorage.setItem("camps", JSON.stringify(updatedCamps))
          setCamps(updatedCamps)

          // Remove selection
          const updatedSelections = { ...campSelections }
          delete updatedSelections[userEmail]
          localStorage.setItem("campSelections", JSON.stringify(updatedSelections))
          setCampSelections(updatedSelections)
        }

        // Remove user's volunteer assignments
        const updatedAssignments = volunteerAssignments.filter((assignment) => assignment.volunteer !== user.name)
        localStorage.setItem("volunteerAssignments", JSON.stringify(updatedAssignments))
        setVolunteerAssignments(updatedAssignments)

        addActivity("user_deleted", `User "${user.name}" (${user.role}) was deleted by admin`, "admin")
        alert(`User "${user.name}" has been successfully deleted.`)
        loadAllData()
      } catch (error) {
        console.error("Error deleting user:", error)
        alert("Failed to delete user. Please try again.")
      }
    }
  }

  const handleDeleteCamp = (campId: number) => {
    const camp = camps.find((c) => c.id === campId)
    if (!camp) return

    if (
      confirm(
        `Are you sure you want to delete camp "${camp.name}"? This will also cancel all selections and volunteer assignments for this camp.`,
      )
    ) {
      try {
        // Remove camp from camps list
        const updatedCamps = camps.filter((c) => c.id !== campId)
        localStorage.setItem("camps", JSON.stringify(updatedCamps))
        setCamps(updatedCamps)

        // Remove all selections for this camp
        const updatedSelections = { ...campSelections }
        Object.keys(updatedSelections).forEach((userEmail) => {
          if (updatedSelections[userEmail].campId === campId) {
            delete updatedSelections[userEmail]
          }
        })
        localStorage.setItem("campSelections", JSON.stringify(updatedSelections))
        setCampSelections(updatedSelections)

        // Remove all volunteer assignments for this camp
        const updatedAssignments = volunteerAssignments.filter((assignment) => assignment.camp !== camp.name)
        localStorage.setItem("volunteerAssignments", JSON.stringify(updatedAssignments))
        setVolunteerAssignments(updatedAssignments)

        addActivity("camp_deleted", `Camp "${camp.name}" was deleted by admin`, "admin")
        alert(`Camp "${camp.name}" has been successfully deleted.`)
        loadAllData()
      } catch (error) {
        console.error("Error deleting camp:", error)
        alert("Failed to delete camp. Please try again.")
      }
    }
  }

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as any

    // Validate required fields
    const requiredFields =
      newUserRole === "refugee"
        ? ["name", "age", "email", "contact", "password", "address", "needs"]
        : ["name", "age", "email", "contact", "password", "skills", "availability"]

    const missingFields = requiredFields.filter((field) => !data[field])
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(", ")}`)
      return
    }

    // Check if user already exists
    if (users.find((user) => user.email === data.email)) {
      alert("A user with this email already exists.")
      return
    }

    try {
      const newUser = {
        ...data,
        role: newUserRole,
        registrationDate: new Date().toISOString(),
      }

      const updatedUsers = [...users, newUser]
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)

      addActivity("user_created", `New ${newUserRole} "${data.name}" was created by admin`, "admin")
      alert(`User "${data.name}" has been successfully created.`)
      setShowAddUser(false)
      loadAllData()
    } catch (error) {
      console.error("Error adding user:", error)
      alert("Failed to add user. Please try again.")
    }
  }

  const handleAddCamp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as any

    if (!data.name || !data.beds || !data.contact) {
      alert("Please fill in all required fields.")
      return
    }

    try {
      const resources = []
      if (data.food) resources.push("Food")
      if (data.water) resources.push("Water")
      if (data.medical) resources.push("Medical Aid")
      if (data.blankets) resources.push("Blankets")
      if (data.clothing) resources.push("Clothing")
      if (data.hygiene) resources.push("Hygiene Kits")

      const newCamp: Camp = {
        id: Math.max(...camps.map((c) => c.id), 0) + 1,
        name: data.name,
        beds: Number.parseInt(data.beds),
        originalBeds: Number.parseInt(data.beds),
        resources,
        contact: data.contact,
        ambulance: data.ambulance || "No",
        type: "volunteer-added",
        addedBy: "admin",
        addedDate: new Date().toISOString(),
      }

      const updatedCamps = [...camps, newCamp]
      localStorage.setItem("camps", JSON.stringify(updatedCamps))
      setCamps(updatedCamps)

      addActivity("camp_created", `New camp "${data.name}" was created by admin`, "admin")
      alert(`Camp "${data.name}" has been successfully created.`)
      setShowAddCamp(false)
      loadAllData()
    } catch (error) {
      console.error("Error adding camp:", error)
      alert("Failed to add camp. Please try again.")
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "user_registration":
        return "text-green-600"
      case "camp_selection":
        return "text-blue-600"
      case "camp_cancellation":
        return "text-orange-600"
      case "volunteer_assignment":
        return "text-purple-600"
      case "user_created":
        return "text-green-700"
      case "user_deleted":
        return "text-red-600"
      case "camp_created":
        return "text-blue-700"
      case "camp_deleted":
        return "text-red-700"
      default:
        return "text-slate-600"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const totalUsers = users.length
  const refugeeCount = users.filter((u) => u.role === "refugee").length
  const volunteerCount = users.filter((u) => u.role === "volunteer").length
  const totalCamps = camps.length
  const totalBeds = camps.reduce((sum, camp) => sum + camp.originalBeds, 0)
  const availableBeds = camps.reduce((sum, camp) => sum + camp.beds, 0)
  const totalSelections = Object.keys(campSelections).length
  const totalVolunteerAssignments = volunteerAssignments.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1
            onClick={() => router.push("/")}
            className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent cursor-pointer"
          >
            🛡️ Admin Dashboard - Flood Rehabilitation
          </h1>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 font-medium">
              Home
            </button>
            <span className="text-sm bg-red-100 px-3 py-1 rounded-full text-red-800">🛡️ Admin: {currentUser?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-red-100 to-red-200 rounded-xl p-8 text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">🛡️ Administrator Control Panel</h1>
          <p className="text-xl text-slate-600">Manage users, camps, and monitor system activities</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "📊 Overview", icon: "📊" },
                { id: "users", label: "👥 Users", icon: "👥" },
                { id: "camps", label: "🏕️ Camps", icon: "🏕️" },
                { id: "volunteers", label: "🤝 Volunteers", icon: "🤝" },
                { id: "activities", label: "📋 Activities", icon: "📋" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total Users</p>
                        <p className="text-3xl font-bold">{totalUsers}</p>
                      </div>
                      <div className="text-4xl opacity-80">👥</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Total Camps</p>
                        <p className="text-3xl font-bold">{totalCamps}</p>
                      </div>
                      <div className="text-4xl opacity-80">🏕️</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Camp Selections</p>
                        <p className="text-3xl font-bold">{totalSelections}</p>
                      </div>
                      <div className="text-4xl opacity-80">📋</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100">Available Beds</p>
                        <p className="text-3xl font-bold">
                          {availableBeds}/{totalBeds}
                        </p>
                      </div>
                      <div className="text-4xl opacity-80">🛏️</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-100">Volunteer Assignments</p>
                        <p className="text-3xl font-bold">{totalVolunteerAssignments}</p>
                      </div>
                      <div className="text-4xl opacity-80">🤝</div>
                    </div>
                  </div>
                </div>

                {/* User Breakdown */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-xl">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">👥 User Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">🆘 Refugees</span>
                        <span className="font-semibold text-blue-600">{refugeeCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">🤝 Volunteers</span>
                        <span className="font-semibold text-green-600">{volunteerCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">🏕️ Camp Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Beds</span>
                        <span className="font-semibold text-slate-800">{totalBeds}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Occupied</span>
                        <span className="font-semibold text-red-600">{totalBeds - availableBeds}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Available</span>
                        <span className="font-semibold text-green-600">{availableBeds}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-slate-50 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">📋 Recent Activities</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {activities.slice(0, 10).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex justify-between items-center py-2 border-b border-slate-200"
                      >
                        <div>
                          <span className={`font-medium ${getActivityColor(activity.type)}`}>
                            {activity.description}
                          </span>
                          {activity.user && <span className="text-slate-500 text-sm ml-2">by {activity.user}</span>}
                        </div>
                        <span className="text-slate-400 text-sm">{new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-slate-500 text-center py-4">No activities recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">👥 User Management</h2>
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ➕ Add User
                  </button>
                </div>

                {showAddUser && (
                  <div className="bg-slate-50 p-6 rounded-xl">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">➕ Add New User</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">User Role</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setNewUserRole("refugee")}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            newUserRole === "refugee"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          🆘 Refugee
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewUserRole("volunteer")}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            newUserRole === "volunteer"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          🤝 Volunteer
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                          <input
                            type="text"
                            name="name"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Age *</label>
                          <input
                            type="number"
                            name="age"
                            required
                            min={newUserRole === "volunteer" ? 18 : 1}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                          <input
                            type="email"
                            name="email"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Contact *</label>
                          <input
                            type="tel"
                            name="contact"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                        <input
                          type="password"
                          name="password"
                          required
                          minLength={6}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {newUserRole === "refugee" ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                            <textarea
                              name="address"
                              required
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assistance Needed *</label>
                            <textarea
                              name="needs"
                              required
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Skills *</label>
                            <textarea
                              name="skills"
                              required
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Availability *</label>
                            <textarea
                              name="availability"
                              required
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✅ Create User
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddUser(false)}
                          className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Registered
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {users.map((user) => {
                          const userSelection = campSelections[user.email]
                          const userAssignments = volunteerAssignments.filter((a) => a.volunteer === user.name)
                          return (
                            <tr key={user.email} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-slate-900">{user.name}</div>
                                  <div className="text-sm text-slate-500">{user.email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.role === "refugee"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {user.role === "refugee" ? "🆘 Refugee" : "🤝 Volunteer"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{user.contact}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-1">
                                  {userSelection && (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      🏕️ {userSelection.campName}
                                    </span>
                                  )}
                                  {user.role === "volunteer" && userAssignments.length > 0 && (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                      🤝 {userAssignments.length} assignments
                                    </span>
                                  )}
                                  {!userSelection && userAssignments.length === 0 && (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                                      No activity
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {user.registrationDate
                                  ? new Date(user.registrationDate).toLocaleDateString()
                                  : "Unknown"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleDeleteUser(user.email)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                >
                                  🗑️ Delete
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {users.length === 0 && <div className="text-center py-8 text-slate-500">No users found.</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Camps Tab */}
            {activeTab === "camps" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">🏕️ Camp Management</h2>
                  <button
                    onClick={() => setShowAddCamp(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ➕ Add Camp
                  </button>
                </div>

                {showAddCamp && (
                  <div className="bg-slate-50 p-6 rounded-xl">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">➕ Add New Camp</h3>
                    <form onSubmit={handleAddCamp} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Camp Name *</label>
                          <input
                            type="text"
                            name="name"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Number of Beds *</label>
                          <input
                            type="number"
                            name="beds"
                            required
                            min="1"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number *</label>
                          <input
                            type="tel"
                            name="contact"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Ambulance Available</label>
                          <select
                            name="ambulance"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="Yes">Yes</option>
                            <option value="Nearby">Nearby</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Available Resources</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {["food", "water", "medical", "blankets", "clothing", "hygiene"].map((resource) => (
                            <label key={resource} className="flex items-center">
                              <input
                                type="checkbox"
                                name={resource}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-slate-700 capitalize">{resource}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✅ Create Camp
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddCamp(false)}
                          className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Camps Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {camps.map((camp) => {
                    const occupancyRate = ((camp.originalBeds - camp.beds) / camp.originalBeds) * 100
                    const campAssignments = volunteerAssignments.filter((a) => a.camp === camp.name)
                    return (
                      <div key={camp.id} className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-semibold text-slate-800">{camp.name}</h3>
                          <button
                            onClick={() => handleDeleteCamp(camp.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm font-medium text-slate-600">Beds Available</span>
                            <div className="font-semibold text-slate-800">
                              {camp.beds} / {camp.originalBeds}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Occupancy</span>
                            <div className="font-semibold text-slate-800">{occupancyRate.toFixed(0)}%</div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Contact</span>
                            <div className="font-semibold text-slate-800">{camp.contact}</div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Volunteers</span>
                            <div className="font-semibold text-slate-800">{campAssignments.length}</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="text-sm font-medium text-slate-600">Resources</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {camp.resources.map((resource) => (
                              <span
                                key={resource}
                                className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                              >
                                {resource}
                              </span>
                            ))}
                          </div>
                        </div>

                        {campAssignments.length > 0 && (
                          <div className="mb-4">
                            <span className="text-sm font-medium text-slate-600">Assigned Volunteers</span>
                            <div className="mt-1 space-y-1">
                              {campAssignments.slice(0, 3).map((assignment) => (
                                <div key={assignment.id} className="text-sm text-slate-700">
                                  🤝 {assignment.volunteer} - {new Date(assignment.date).toLocaleDateString()}
                                </div>
                              ))}
                              {campAssignments.length > 3 && (
                                <div className="text-sm text-slate-500">
                                  +{campAssignments.length - 3} more volunteers
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {camp.type === "volunteer-added" && (
                          <div className="text-sm text-slate-500">
                            Added by: {camp.addedBy} on{" "}
                            {camp.addedDate ? new Date(camp.addedDate).toLocaleDateString() : "Unknown"}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Volunteers Tab */}
            {activeTab === "volunteers" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">🤝 Volunteer Assignments</h2>

                <div className="bg-white rounded-xl shadow-lg">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">All Volunteer Assignments</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Volunteer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Camp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Assignment Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Contact
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {volunteerAssignments
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((assignment) => {
                              const volunteer = users.find((u) => u.name === assignment.volunteer)
                              return (
                                <tr key={assignment.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-slate-900">{assignment.volunteer}</div>
                                      {volunteer && <div className="text-sm text-slate-500">{volunteer.email}</div>}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                      🏕️ {assignment.camp}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                    {new Date(assignment.date).toLocaleDateString()}
                                    <div className="text-xs text-slate-500">
                                      {new Date(assignment.date).toLocaleTimeString()}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                    {volunteer?.contact || "N/A"}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                      {volunteerAssignments.length === 0 && (
                        <div className="text-center py-8 text-slate-500">No volunteer assignments found.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Volunteer Statistics */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                    <h4 className="text-lg font-semibold mb-2">Total Assignments</h4>
                    <p className="text-3xl font-bold">{volunteerAssignments.length}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                    <h4 className="text-lg font-semibold mb-2">Active Volunteers</h4>
                    <p className="text-3xl font-bold">{new Set(volunteerAssignments.map((a) => a.volunteer)).size}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                    <h4 className="text-lg font-semibold mb-2">Camps with Volunteers</h4>
                    <p className="text-3xl font-bold">{new Set(volunteerAssignments.map((a) => a.camp)).size}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === "activities" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">📋 System Activities</h2>

                <div className="bg-white rounded-xl shadow-lg">
                  <div className="p-6">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {activities.map((activity) => (
                        <div key={activity.id} className="border-b border-slate-200 pb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`font-medium ${getActivityColor(activity.type)}`}>
                                {activity.description}
                              </span>
                              {activity.user && <span className="text-slate-500 text-sm ml-2">by {activity.user}</span>}
                            </div>
                            <span className="text-slate-400 text-sm">
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      {activities.length === 0 && (
                        <p className="text-slate-500 text-center py-8">No activities recorded yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
