import { useState } from "react"
import { BookOpen, Copyright } from "lucide-react"
import LoginForm from "./Login"
import { SignupForm } from "./Signup"
import { useLocation } from "react-router-dom"

export default function AuthPage() {
  const location = useLocation()
  const isLogin = location.pathname === "/"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#fdcc03]/5 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-16 h-16 bg-[#fdcc03] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <BookOpen/>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Velammal Engineering College</h1>
          <p className="text-slate-600">
            {isLogin ? "Welcome back! Please sign in to continue." : "Create your admin/staff account to get started."}
          </p>
        </div>

        {/* Auth Form div */}
        <div className="p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm animate-slide-in-right">
          {/* Forms */}
          <div className="transition-all duration-500 ease-in-out">{isLogin ? <LoginForm /> : <SignupForm />}</div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-500 animate-fade-in-up">
          <p className="flex justify-center items-center gap-2"><Copyright /> <a href="https://velammal.edu.in/webteam" target="_blank" className="cursor-pointer font-bold text-black" >WebOps VEC</a>, Velammal Engineering College, Chennai</p>
        </div>
      </div>
    </div>
  )
}
