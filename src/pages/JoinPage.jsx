import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Tag } from 'lucide-react'
import { motion } from 'framer-motion'

function Field({ icon: Icon, type = 'text', placeholder, value, onChange, endAdornment }) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtext" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 rounded-md border border-brand-border text-sm text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/30 focus:border-dessa-teal"
      />
      {endAdornment}
    </div>
  )
}

export default function JoinPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Navy backdrop with decorative shapes */}
      <div className="absolute inset-0 h-[480px] bg-dessa-navy overflow-hidden">
        <div className="absolute -left-24 top-16 w-80 h-80 rounded-full bg-[#3B7DD8]" />
        <div className="absolute left-24 top-56 w-36 h-36 rounded-full bg-mtw-amber flex items-center justify-center">
          <div
            className="w-16 h-16"
            style={{
              background: 'repeating-conic-gradient(#F5A623 0deg 15deg, transparent 15deg 30deg)',
              borderRadius: '9999px',
            }}
          />
        </div>
        <svg className="absolute left-[380px] top-14" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <path
            d="M50 5 C30 5 15 20 15 40 C15 55 25 65 40 65 C25 65 12 52 12 35 C12 18 26 5 45 5 Z"
            fill="#5BC8A8"
          />
        </svg>
        <svg className="absolute left-[500px] top-10" width="70" height="60" viewBox="0 0 70 60" fill="none">
          <path d="M0 60 L0 45 L18 45 L18 30 L36 30 L36 15 L54 15 L54 0" stroke="white" strokeWidth="2" fill="none" />
        </svg>
        <svg className="absolute right-16 top-0" width="260" height="220" viewBox="0 0 260 220" fill="none">
          <circle cx="130" cy="0" r="150" stroke="white" strokeWidth="1.5" fill="none" opacity="0.7" />
        </svg>
        <svg className="absolute right-20 top-32" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path
            d="M30 0 L34 26 L60 30 L34 34 L30 60 L26 34 L0 30 L26 26 Z"
            fill="#E8653A"
          />
        </svg>
        <div className="absolute right-0 bottom-0 w-72 h-40 rounded-tl-full bg-[#5BC8A8]/60 translate-y-1/2" />

        <div className="absolute right-8 top-8 flex items-center gap-2 text-white">
          <span className="text-lg font-bold tracking-tight">DESSA</span>
          <span className="text-white/50 text-sm">×</span>
          <span className="text-sm font-bold tracking-widest uppercase leading-none">
            Move<br />This World
          </span>
        </div>
      </div>

      <div className="absolute inset-0 top-[480px] bg-brand-bg" />

      <div className="relative min-h-screen flex items-start justify-center pt-40 px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
        >
          <h1 className="text-2xl font-semibold text-brand-text mb-1">Create Your Family Account</h1>
          <p className="text-sm text-brand-subtext mb-6">
            Sign up to access SEL activities you can do together with your student.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-brand-text mb-1.5 block">Full Name</label>
              <Field icon={Mail} placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium text-brand-text mb-1.5 block">Email Address</label>
              <Field icon={Mail} type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium text-brand-text mb-1.5 block">Password</label>
              <Field
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-subtext"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-brand-text mb-1.5 block">Site Code</label>
              <Field
                icon={Tag}
                placeholder="Enter the code from your school"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <p className="text-xs text-brand-subtext mt-1.5">
                Given to you by your child's school or program.
              </p>
            </div>

            <button className="w-full bg-dessa-teal text-white text-sm font-semibold py-3 rounded-md hover:bg-dessa-teal/90 transition-colors mt-1">
              Create Account
            </button>

            <p className="text-center text-sm text-brand-subtext">
              Already have an account?{' '}
              <a href="#" className="text-dessa-teal font-medium">Log in</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
