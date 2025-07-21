"use client"

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

export default function CampsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [camps, setCamps] = useState<Camp[]>([])
  const [userSelection, setUserSelection] = useState<CampSelection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      alert("Please login to access relief camps information.")
      router.push("/login")
      return
    }

    setCurrentUser(user)
    initializeCamps()
    loadCamps()
    loadUserSelection(user.email)
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
      return true
    } catch (error) {
      console.error("Error saving camps:", error)
      return false
    }
  }

  const loadUserSelection = (userEmail: string) => {
    try {
      const selections = localStorage.getItem("campSelections")
      const allSelections = selections ? JSON.parse(selections) : {}
      setUserSelection(allSelections[userEmail] || null)
    } catch (error) {
      console.error("Error loading user selection:", error)
    }
  }

  const saveUserSelection = (campId: number, campName: string) => {
    if (!currentUser) return false

    try {
      const selections = localStorage.getItem("campSelections")
      const allSelections = selections ? JSON.parse(selections) : {}

      allSelections[currentUser.email] = {
        campId,
        campName,
        selectedDate: new Date().toISOString(),
        userName: currentUser.name,
      }

      localStorage.setItem("campSelections", JSON.stringify(allSelections))
      setUserSelection(allSelections[currentUser.email])
      return true
    } catch (error) {
      console.error("Error saving user selection:", error)
      return false
    }
  }

  const clearUserSelection = () => {
    if (!currentUser) return false

    try {
      const selections = localStorage.getItem("campSelections")
      const allSelections = selections ? JSON.parse(selections) : {}

      delete allSelections[currentUser.email]
      localStorage.setItem("campSelections", JSON.stringify(allSelections))
      setUserSelection(null)
      return true
    } catch (error) {
      console.error("Error clearing user selection:", error)
      return false
    }
  }

  const selectCamp = (campId: number) => {
    const camp = camps.find((c) => c.id === campId)
    if (!camp || !currentUser) {
      alert("Error selecting camp. Please try again.")
      return
    }

    if (userSelection) {
      alert("You already have a camp selected. Please cancel your current selection first.")
      return
    }

    if (camp.beds <= 0) {
      alert("This camp is full. Please select another camp.")
      return
    }

    // Decrease bed count
    const updatedCamps = camps.map((c) => (c.id === campId ? { ...c, beds: c.beds - 1 } : c))

    if (saveCamps(updatedCamps)) {
      if (saveUserSelection(campId, camp.name)) {
        alert(`Successfully selected "${camp.name}"! Your bed has been reserved.`)
      } else {
        // Rollback bed count if selection save failed
        const rollbackCamps = camps.map((c) => (c.id === campId ? { ...c, beds: c.beds } : c))
        saveCamps(rollbackCamps)
        alert("Failed to save your selection. Please try again.")
      }
    } else {
      alert("Failed to update camp information. Please try again.")
    }
  }

  const cancelSelection = () => {
    if (!userSelection) {
      alert("No camp selection found to cancel.")
      return
    }

    if (
      confirm(
        `Are you sure you want to cancel your selection for "${userSelection.campName}"? This will free up your reserved bed.`,
      )
    ) {
      const updatedCamps = camps.map((c) => (c.id === userSelection.campId ? { ...c, beds: c.beds + 1 } : c))

      if (saveCamps(updatedCamps)) {
        if (clearUserSelection()) {
          alert(`Successfully cancelled your selection for "${userSelection.campName}".`)
        } else {
          alert("Failed to cancel selection. Please try again.")
        }
      }
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
          <p className="text-slate-600">Loading camps...</p>
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
            <span className="text-blue-600 font-medium">Relief Camps</span>
            <button onClick={() => router.push("/profile")} className="text-blue-600 hover:text-blue-800 font-medium">
              Profile
            </button>
            {currentUser?.role === "volunteer" && (
              <button
                onClick={() => router.push("/dashboard")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Dashboard
              </button>
            )}
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
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-8 text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">🏕️ Welcome, {currentUser?.name} - Relief Camps</h1>
          <p className="text-xl text-slate-600">Find the best relief camps and resources available in your area</p>
        </div>

        {/* User Profile Section */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h3 className="text-2xl font-semibold text-blue-600 mb-4">👤 Your Profile Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>📧 Email:</strong> {currentUser?.email}
              </p>
              <p>
                <strong>📞 Contact:</strong> {currentUser?.contact}
              </p>
              <p>
                <strong>👤 Role:</strong> {currentUser?.role === "refugee" ? "Relief Seeker" : "Volunteer"}
              </p>
            </div>
            <div>
              {currentUser?.age && (
                <p>
                  <strong>🎂 Age:</strong> {currentUser.age}
                </p>
              )}
              {currentUser?.address && (
                <p>
                  <strong>📍 Address:</strong> {currentUser.address}
                </p>
              )}
              {currentUser?.needs && (
                <p>
                  <strong>📝 Assistance Needed:</strong> {currentUser.needs}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* User Selection Status */}
        <div className={`bg-white rounded-xl p-6 mb-8 shadow-lg ${userSelection ? "border-2 border-green-500" : ""}`}>
          <h3 className={`text-2xl font-semibold mb-4 ${userSelection ? "text-green-600" : "text-blue-600"}`}>
            📋 Your Camp Selection Status
          </h3>
          {userSelection ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="text-xl font-semibold text-slate-800 mb-2">🏕️ {userSelection.campName}</div>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>📅 Selected on:</strong> {new Date(userSelection.selectedDate).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>⏰ Time:</strong> {new Date(userSelection.selectedDate).toLocaleTimeString()}
                      </p>
                      <p>
                        <strong>👤 Selected by:</strong> {userSelection.userName}
                      </p>
                    </div>
                    <div className="mt-3 p-2 bg-green-100 rounded text-green-800 font-semibold">
                      ✅ Your bed is reserved at this camp
                    </div>
                  </div>
                  <button
                    onClick={cancelSelection}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🗑️ Cancel Selection
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>💡 Note:</strong> Your selection is automatically saved and will be restored when you log in
                  again.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600">
                You haven't selected a camp yet. Browse the available camps below and select one that suits your needs.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>💡 Tip:</strong> Once you select a camp, your choice will be saved and you can access it
                  anytime by logging in.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">🗺️ Relief Camps Near You</h2>
          <p className="text-slate-600 max-w-3xl mx-auto">
            These camps provide emergency accommodation, food, medical care, and other essential services for flood
            victims and their families.
          </p>
        </div>

        {/* Camps Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {camps.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-lg">
              <h3 className="text-xl text-slate-600 mb-4">No camps available</h3>
              <p className="text-slate-500">Camps will appear here when volunteers add them through the dashboard.</p>
            </div>
          ) : (
            camps.map((camp) => {
              const isSelected = userSelection && userSelection.campId === camp.id
              const hasNoBeds = camp.beds <= 0
              const isLowBeds = camp.beds > 0 && camp.beds <= 3
              const isVolunteerAdded = camp.type === "volunteer-added"

              return (
                <div
                  key={camp.id}
                  className={`bg-white rounded-xl p-6 shadow-lg transition-all hover:shadow-xl ${
                    isSelected
                      ? "border-2 border-green-500 bg-green-50"
                      : hasNoBeds
                        ? "border-2 border-red-300 bg-red-50 opacity-70"
                        : "hover:-translate-y-1"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                      🏕️ {camp.name}
                      {isVolunteerAdded && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                      )}
                      {isSelected && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Selected</span>
                      )}
                      {hasNoBeds && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Full</span>}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-slate-600">🛏️ BEDS</span>
                      <div
                        className={`font-semibold ${hasNoBeds ? "text-red-600" : isLowBeds ? "text-orange-600" : "text-slate-800"}`}
                      >
                        {hasNoBeds ? "FULL" : `${camp.beds} Available`}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">🍽️ FOOD</span>
                      <div className="font-semibold text-slate-800">
                        {camp.resources.includes("Food") ? "Available" : "Limited"}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">🏥 MEDICAL</span>
                      <div className="font-semibold text-slate-800">
                        {camp.resources.includes("Medical Aid") ? "First Aid" : "Basic Care"}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">💧 WATER</span>
                      <div className="font-semibold text-slate-800">
                        {camp.resources.includes("Water") ? "Clean water" : "Available"}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mb-4">
                    {!isSelected && !hasNoBeds && !userSelection && (
                      <button
                        onClick={() => selectCamp(camp.id)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        🏕️ Select This Camp
                      </button>
                    )}
                    {isSelected && (
                      <button
                        onClick={cancelSelection}
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        🗑️ Cancel Selection
                      </button>
                    )}
                    {hasNoBeds && (
                      <button disabled className="w-full bg-gray-400 text-white py-2 rounded-lg cursor-not-allowed">
                        🚫 Camp Full
                      </button>
                    )}
                    {userSelection && !isSelected && (
                      <button disabled className="w-full bg-gray-400 text-white py-2 rounded-lg cursor-not-allowed">
                        ⚠️ Already Selected Another Camp
                      </button>
                    )}
                  </div>

                  {/* Info Boxes */}
                  {camp.contact && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-3">
                      <span className="text-red-600 font-medium">🚨 Emergency Contact: {camp.contact}</span>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-3">
                    <span className="text-blue-600 font-medium">
                      🚑 Ambulance Available:{" "}
                      {camp.ambulance === "Yes"
                        ? "Yes | Emergency: 102"
                        : camp.ambulance === "Nearby"
                          ? "Nearby hospital available"
                          : "Contact local emergency services"}
                    </span>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <div className="text-yellow-800 font-medium mb-2">💡 Health Awareness Tips:</div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>✓ Wash hands frequently with soap and clean water</li>
                      <li>✓ Use mosquito nets at night to prevent vector-borne diseases</li>
                      <li>✓ Report fever, rashes, or diarrhea to the medical tent immediately</li>
                      <li>✓ Keep your sleeping area clean and well-ventilated</li>
                    </ul>
                  </div>

                  {isVolunteerAdded && camp.addedBy && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      <strong>👤 Added by volunteer:</strong> {camp.addedBy}
                      {camp.addedDate && ` on ${new Date(camp.addedDate).toLocaleDateString()}`}
                    </div>
                  )}

                  {camp.originalBeds && (
                    <div className="mt-2 text-center text-sm text-slate-500">
                      Original capacity: {camp.originalBeds} beds
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Action Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <h3 className="text-2xl font-semibold text-slate-800 mb-4">🤝 Need Help or Want to Contribute?</h3>
          <p className="text-slate-600 mb-6">
            Access additional resources or help coordinate relief efforts in your community.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => router.push("/")}
              className="border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
            >
              🏠 Back to Home
            </button>
            <button
              onClick={() => {
                loadCamps()
                alert("Camp information refreshed successfully!")
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              🔄 Refresh Camps
            </button>
            {currentUser?.role === "volunteer" && (
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📊 Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
