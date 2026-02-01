import { useState } from "react"
import { Eye, EyeOff, User, Mail, Lock, Phone, UserCheck } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    role: "",
    email: "",
    password: "",
    phone_no: "",
    name: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/main-backend/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone_no: formData.phone_no,
          role: formData.role
        }),
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Login failed")
      }

      const sessionData = {
        token: data.token,
        role: data.role,
        session: data.session,
      }

      // login(sessionData)
      setSuccess("Account created successful!")
      setFormData({
        role: "",
        email: "",
        password: "",
        phone_no: "",
        name: ""
      })

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleRoleChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name Field */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-slate-700 font-medium">
          Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full pl-10 h-11 border-slate-300 focus:border-[#fdcc03] focus:ring-2 focus:ring-[#fdcc03]/20 transition-all duration-300"
            required
          />
        </div>
      </div>

      {/* Role Field */}
      <div className="space-y-2">
        <label htmlFor="role" className="text-slate-700 font-medium">
          Role
        </label>
        <div className="relative">
          <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 z-10" />
          <select
            onChange={(e) => handleRoleChange(e.target.value)}
            required
            className="w-full pl-10 h-11 border-slate-300 focus:border-[#fdcc03] focus:ring-2 focus:ring-[#fdcc03]/20 transition-all duration-300"
          >
            <option value="" disabled selected>
              Select your role
            </option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-slate-700 font-medium">
          Username
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            id="email"
            name="email"
            type="email"
            placeholder="admin@velammal.edu.in"
            value={formData.email}
            onChange={handleChange}
            className="w-full pl-10 h-11 border-slate-300 focus:border-[#fdcc03] focus:ring-2 focus:ring-[#fdcc03]/20 transition-all duration-300"
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-slate-700 font-medium">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            className="w-full pl-10 pr-10 h-11 border-slate-300 focus:border-[#fdcc03] focus:ring-2 focus:ring-[#fdcc03]/20 transition-all duration-300"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#800000] transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Phone Number Field */}
      <div className="space-y-2">
        <label htmlFor="phone_no" className="text-slate-700 font-medium">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            id="phone_no"
            name="phone_no"
            type="tel"
            placeholder="Phone Number"
            value={formData.phone_no}
            onChange={handleChange}
            className="w-full pl-10 h-11 border-slate-300 focus:border-[#fdcc03] focus:ring-2 focus:ring-[#fdcc03]/20 transition-all duration-300"
            required
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-[#fdcc03] hover:bg-[#800000] focus:bg-[#800000] text-black hover:text-white focus:text-white font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-6"
      >
        {loading ? "Signing in..." : "Create Admin account"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}
    </form>
  )
}
