import { useState } from "react"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await axios.post("/api/main-backend/auth/staff/login", { email: formData.identifier, password: formData.password })

      const data = res.data;

      const sessionData = {
        token: data.token,
        role: data.role,
        session: data.session,
      }

      login(sessionData)
      setSuccess("Login successful! Redirecting...")

      const redirectPath =
        data.role === "admin"
          ? "/staff-dashboard"
          : "/scheduled-exam"

      setTimeout(() => navigate(redirectPath), 500)
    } catch (err) {
      setError(err.response.data.message)
      console.error(err);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <label className="text-slate-700 font-medium">
          Username
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            name="identifier"
            type="text"
            placeholder="admin@velammal.edu.com"
            value={formData.identifier}
            onChange={handleChange}
            className="pl-10 h-12 w-full border-slate-300 focus:border-[#fdcc03] focus:ring-2 focus:ring-[#fdcc03]/20 transition-all"
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label className="text-slate-700 font-medium">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            className="pl-10 pr-10 h-12 w-full border-slate-300 focus:border-[#fdcc03] focus:ring-2 focus:ring-[#fdcc03]/20 transition-all"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#800000]"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-[#fdcc03] hover:bg-[#800000] text-black hover:text-white font-medium transition-all"
      >
        {loading ? "Signing in..." : "Sign In as QA Admin"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}
    </form>
  )
}