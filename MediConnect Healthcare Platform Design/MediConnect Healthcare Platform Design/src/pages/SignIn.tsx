import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  HeartPulse,
  ArrowLeft,
  User,
  Stethoscope,
  ClipboardList,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SignInProps {
  navigate: (route: string) => void;
  onSignIn: (email: string, password: string) => Promise<void>;
}

export default function SignIn({ navigate, onSignIn }: SignInProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'patient',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    { id: 'patient', label: 'Patient', icon: User, color: 'blue' },
    { id: 'assistant', label: 'Medical Assistant', icon: ClipboardList, color: 'teal' },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'green' },
    { id: 'admin', label: 'Administrator', icon: Shield, color: 'purple' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      await onSignIn(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-6">


      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">

        {/* LEFT SIDE – BRAND & MESSAGE */}
        <motion.div
  initial={{ opacity: 0, x: -60 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.9, ease: 'easeOut' }}
  className="hidden lg:block"
>
  <div className="relative">

    {/* Animated Gradient Glow */}
    <motion.div
      animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
      transition={{ duration: 8, repeat: Infinity }}
      className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"
    />

    <div className="relative bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl p-12 shadow-2xl overflow-hidden">

      {/* BRAND HEADER */}
      <div className="flex items-center gap-4 mb-10">

        {/* STETHOSCOPE ICON – INTERACTIVE */}
        <motion.div
          whileHover={{ scale: 1.2, rotate: 10 }}
          whileTap={{ scale: 0.95 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl cursor-pointer"
        >
          <Stethoscope className="w-7 h-7 text-blue-600" />
        </motion.div>

        <span className="text-3xl font-extrabold tracking-wide text-white">
          MediConnect
        </span>
      </div>

      {/* WELCOME TEXT */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold text-white mb-4"
      >
        Welcome Back
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-lg text-blue-100 mb-10 leading-relaxed"
      >
        Secure, reliable and intelligent healthcare access —  
        designed for patients, doctors and medical staff.
      </motion.p>

      {/* FEATURE LIST */}
      <div className="space-y-5">
        {[
          'Secure medical data access',
          'Real-time healthcare support',
          'Professional clinical workflows',
        ].map((text, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.2 }}
            whileHover={{ x: 8 }}
            className="flex items-center gap-3 cursor-default"
          >
            <motion.span
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              className="w-2.5 h-2.5 rounded-full bg-white"
            />
            <span className="text-white text-base">
              {text}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
</motion.div>


        {/* RIGHT SIDE – SIGN IN FORM */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-200">

            {/* MOBILE LOGO */}
            <div className="flex items-center gap-3 mb-4 lg:hidden">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                MediConnect
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sign In
            </h1>
            <p className="text-gray-600 mb-8">
              Access your healthcare dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ROLE SELECTION */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sign in as
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const active = formData.role === role.id;

                    return (
                      <motion.button
                        key={role.id}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setFormData({ ...formData, role: role.id })
                        }
                        className={`p-4 rounded-xl border-2 transition-all ${
                          active
                            ? `border-${role.color}-600 bg-${role.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 mx-auto mb-2 ${
                            active
                              ? `text-${role.color}-600`
                              : 'text-gray-400'
                          }`}
                        />
                        <div
                          className={`text-sm font-medium ${
                            active
                              ? `text-${role.color}-600`
                              : 'text-gray-600'
                          }`}
                        >
                          {role.label}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300
                             focus:ring-4 focus:ring-blue-500/30
                             focus:border-blue-500 transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Password
  </label>

  <div className="relative">
    <input
      type={showPassword ? 'text' : 'password'}
      required
      value={formData.password}
      onChange={(e) =>
        setFormData({ ...formData, password: e.target.value })
      }
      className="
        w-full
        h-12
        px-3
        pr-12
        rounded-xl
        border border-gray-300
        bg-blue-50
        focus:bg-white
        focus:ring-4 focus:ring-blue-500/30
        focus:border-blue-500
        transition-all
      "
      placeholder="Enter your password"
    />

    {/* 👁️ EYE – PERFECTLY CENTERED */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="
        absolute
        top-1/2
        right-0
        -translate-y-1/2
        text-gray-400
        hover:text-blue-600
        transition
      "
      aria-label="Toggle password visibility"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>
</div>


              {/* ERROR */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 text-red-600 rounded-xl text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* SUBMIT */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-teal-500
                           text-white rounded-xl shadow-lg hover:shadow-2xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </motion.button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => navigate('signup')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign Up
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
