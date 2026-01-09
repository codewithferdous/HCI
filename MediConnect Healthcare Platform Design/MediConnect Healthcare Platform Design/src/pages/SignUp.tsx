import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Heart, User, Stethoscope, ClipboardList, Shield, ArrowLeft, Clock, Eye, EyeOff, ChevronDown } from 'lucide-react';

interface SignUpProps {
  navigate: (route: string) => void;
  onSignUp: (email: string, password: string, name: string, role: string) => Promise<{ success: boolean; needsApproval: boolean }>;
}

type PasswordStrength = 'Weak' | 'Good' | 'Strong';

const countries = [
  { code: 'US', name: 'United States', dialCode: '+1' },

  { code: 'DK', name: 'Denmark', dialCode: '+45' },
   { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'GR', name: 'Greece', dialCode: '+30' },
  { code: 'IE', name: 'Ireland', dialCode: '+353' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'AE', name: 'UAE', dialCode: '+971' },
 
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'RU', name: 'Russia', dialCode: '+7' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
 
];

export default function SignUp({ navigate, onSignUp }: SignUpProps) {
  const [step, setStep] = useState<'role' | 'form' | 'pending'>('role');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    area: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize phone with country code when form step is reached
  useEffect(() => {
    if (step === 'form' && !formData.phone) {
      setFormData(prev => ({ ...prev, phone: selectedCountry.dialCode }));
    }
  }, [step]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

  // Name validation: Only letters & spaces, minimum 2 characters
  const validateName = (name: string): string => {
    if (!name) return '';
    if (name.length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters and spaces';
    return '';
  };

  // Email validation: Must end with @gmail.com, must not start with ., no .., lowercase only, only letters/numbers/dot
  const validateEmail = (email: string): string => {
    if (!email) return '';
    const emailLower = email.toLowerCase();
    
    // Must end with @gmail.com
    if (!emailLower.endsWith('@gmail.com')) {
      return 'Email must end with @gmail.com';
    }
    
    // Must not start with .
    if (emailLower.startsWith('.')) {
      return 'Email must not start with a dot';
    }
    
    // No consecutive dots (..)
    if (emailLower.includes('..')) {
      return 'Email cannot contain consecutive dots';
    }
    
    // Lowercase only
    if (email !== emailLower) {
      return 'Email must be lowercase only';
    }
    
    // Only letters, numbers, and dots allowed (before @gmail.com)
    const localPart = emailLower.replace('@gmail.com', '');
    if (!/^[a-z0-9.]+$/.test(localPart)) {
      return 'Email can only contain letters, numbers, and dots';
    }
    
    return '';
  };

  // Password validation: Min 8 chars, uppercase, lowercase, number, special char, no spaces
  const validatePassword = (password: string): { error: string; strength: PasswordStrength | '' } => {
    if (!password) return { error: '', strength: '' };
    
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain a special character');
    }
    if (/\s/.test(password)) {
      errors.push('Password cannot contain spaces');
    }
    
    // Calculate strength
    let strength: PasswordStrength | '' = '';
    if (password.length > 0) {
      const criteriaMet = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /[0-9]/.test(password),
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        !/\s/.test(password),
      ].filter(Boolean).length;
      
      if (criteriaMet <= 3) {
        strength = 'Weak';
      } else if (criteriaMet <= 5) {
        strength = 'Good';
      } else {
        strength = 'Strong';
      }
    }
    
    return { error: errors[0] || '', strength };
  };

  // Phone validation: Minimum 11 digits, only numbers, must start with +
  const validatePhone = (phone: string): string => {
    if (!phone) return '';
    
    // Must start with +
    if (!phone.startsWith('+')) {
      return 'Phone number must start with +';
    }
    
    // Remove + and check if only numbers remain
    const digitsOnly = phone.substring(1);
    if (!/^\d+$/.test(digitsOnly)) {
      return 'Phone number can only contain numbers after +';
    }
    
    // Minimum 11 digits total (including country code)
    if (digitsOnly.length < 11) {
      return 'Phone number must have at least 11 digits';
    }
    
    return '';
  };

  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value });
    setValidationErrors({ ...validationErrors, name: validateName(value) });
  };

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    setValidationErrors({ ...validationErrors, email: validateEmail(value) });
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    const validation = validatePassword(value);
    setValidationErrors({ ...validationErrors, password: validation.error });
    setPasswordStrength(validation.strength);
  };

  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    // Update phone with new country code if phone already exists
    if (formData.phone) {
      const currentDigits = formData.phone.replace(/^\+\d+/, '').replace(/^\+/, '');
      const newPhone = country.dialCode + currentDigits;
      setFormData({ ...formData, phone: newPhone });
      setValidationErrors({ ...validationErrors, phone: validatePhone(newPhone) });
    } else {
      setFormData({ ...formData, phone: country.dialCode });
    }
  };

  const handlePhoneChange = (value: string) => {
    // Ensure it starts with the selected country code
    if (!value.startsWith('+')) {
      value = selectedCountry.dialCode + value.replace(/[^\d]/g, '');
    } else {
      // If user types +, check if it matches current country code
      if (value.startsWith(selectedCountry.dialCode)) {
        // Allow editing
        value = value.replace(/[^\d+]/g, '');
      } else {
        // If different country code detected, update selected country
        const matchingCountry = countries.find(c => value.startsWith(c.dialCode));
        if (matchingCountry) {
          setSelectedCountry(matchingCountry);
          value = value.replace(/[^\d+]/g, '');
        } else {
          // Keep only digits and +
          value = value.replace(/[^\d+]/g, '');
        }
      }
    }
    
    setFormData({ ...formData, phone: value });
    setValidationErrors({ ...validationErrors, phone: validatePhone(value) });
  };

  const roles = [
    {
      id: 'patient',
      title: 'Patient',
      description: 'Request medical assistance and track your health',
      icon: User,
      color: 'from-blue-600 to-blue-400',
      bgColor: 'from-blue-50 to-blue-100',
    },
    {
      id: 'assistant',
      title: 'Medical Assistant',
      description: 'Visit patients and record vital health metrics',
      icon: ClipboardList,
      color: 'from-teal-600 to-teal-400',
      bgColor: 'from-teal-50 to-teal-100',
    },
    {
      id: 'doctor',
      title: 'Doctor',
      description: 'Review reports and provide expert diagnosis',
      icon: Stethoscope,
      color: 'from-green-600 to-green-400',
      bgColor: 'from-green-50 to-green-100',
    },
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Manage users and monitor system operations',
      icon: Shield,
      color: 'from-purple-600 to-purple-400',
      bgColor: 'from-purple-50 to-purple-100',
    },
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setStep('form');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);
    const phoneError = validatePhone(formData.phone);
    
    setValidationErrors({
      name: nameError,
      email: emailError,
      password: passwordValidation.error,
      phone: phoneError,
    });
    setPasswordStrength(passwordValidation.strength);
    
    // Check if all validations pass
    if (!nameError && !emailError && !passwordValidation.error && !phoneError && formData.name && formData.email && formData.password && formData.phone) {
      handleSignUp();
    } else {
      setError('Please fix the validation errors before submitting');
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await onSignUp(formData.email, formData.password, formData.name, selectedRole);
      
      if (result.needsApproval) {
        setStep('pending');
      }
      // If not needing approval, onSignUp will handle navigation
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        {/* Back to Home Button - Left Side */}
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >

          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-white"  />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              MediConnect
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-xl text-gray-600">Join the future of healthcare</p>

        </motion.div>

        {/* Role Selection */}
        {step === 'role' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
              Select Your Role
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {roles.map((role, index) => (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`p-6 bg-gradient-to-br ${role.bgColor} rounded-2xl border-2 border-transparent hover:border-gray-300 transition-all text-left group`}
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <role.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{role.title}</h3>
                  <p className="text-gray-600">{role.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Registration Form */}
        {step === 'form' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-md mx-auto"
          >
           <motion.button
  onClick={() => setStep('role')}
  whileHover={{ scale: 1.05, x: -4 }}
  whileTap={{ scale: 0.95 }}
  className="group flex items-center gap-3 mb-6 px-4 py-2 rounded-xl
             bg-gradient-to-r from-blue-50 to-teal-50
             text-blue-700 font-medium
             border border-blue-200
             hover:from-blue-100 hover:to-teal-100
             hover:shadow-md transition-all duration-300"
>
  <motion.div
    className="flex items-center justify-center w-9 h-9 rounded-full
               bg-white border border-blue-300
               group-hover:bg-blue-600 group-hover:border-blue-600
               transition-colors duration-300"
  >
    <ArrowLeft className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
  </motion.div>

  <span className="tracking-wide">Change Role</span>
</motion.button>


            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl">
                {roles.find((r) => r.id === selectedRole) && (
                  <>
                    <div className={`w-12 h-12 bg-gradient-to-br ${roles.find((r) => r.id === selectedRole)?.color} rounded-xl flex items-center justify-center`}>
                      {(() => {
                        const Role = roles.find((r) => r.id === selectedRole)?.icon;
                        return Role ? <Role className="w-6 h-6 text-white" /> : null;
                      })()}
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Signing up as</div>
                      <div className="font-semibold text-gray-900">
                        {roles.find((r) => r.id === selectedRole)?.title}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      validationErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      validationErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="your@gmail.com"
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                {selectedRole === 'assistant' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Area
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Downtown, Northside"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative" ref={countryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showCountryDropdown && (
                        <div className="absolute z-10 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-xl shadow-lg">
                          {countries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => handleCountrySelect(country)}
                              className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
                                selectedCountry.code === country.code ? 'bg-blue-100' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{country.name}</span>
                                <span className="text-sm text-gray-600">{country.dialCode}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                  )}
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
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        validationErrors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a secure password"
                    />
                   <button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute left-1 top-1/2 -translate-y-1/2
             text-gray-500 hover:text-gray-700 transition-colors"
>
  {showPassword ? (
    <EyeOff className="w-5 h-5" />
  ) : (
    <Eye className="w-5 h-5" />
  )}
</button>

                  </div>
                  {passwordStrength && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Strength:</span>
                      <span className={`text-sm font-semibold ${
                        passwordStrength === 'Weak' ? 'text-red-600' :
                        passwordStrength === 'Good' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength}
                      </span>
                    </div>
                  )}
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Create Account'}
                </motion.button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('signin')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        )}


        {/* Pending Approval Screen */}
        {step === 'pending' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-200 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Clock className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">Pending Admin Approval</h2>
              <p className="text-xl text-gray-600 mb-8">
                Thank you for registering! Your account is currently pending admin approval.
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
                <ul className="text-left space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">1</span>
                    </div>
                    <span>Our admin team will review your submitted document</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">2</span>
                    </div>
                    <span>Verification typically takes 24-48 hours</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">3</span>
                    </div>
                    <span>You'll receive an email notification once approved</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">4</span>
                    </div>
                    <span>After approval, you can sign in and start using MediConnect</span>
                  </li>
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('landing')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Return to Home
              </motion.button>

              <div className="mt-6 text-sm text-gray-600 text-center">
                Account Status:{' '}
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  Pending Approval
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
