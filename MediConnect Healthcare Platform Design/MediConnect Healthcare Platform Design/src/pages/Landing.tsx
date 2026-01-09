import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { Heart, Shield, Clock, Users, ArrowRight, Activity, Award, ChevronDown, Menu, X, Sparkles, Stethoscope, Calendar, Mail, Linkedin, Twitter, Github } from 'lucide-react';

interface LandingProps {
  navigate: (route: string) => void;
}

// Animated Counter Component
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
  const displayValue = useMotionValue(0);
  const spring = useSpring(displayValue, { damping: 30, stiffness: 100 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    displayValue.set(numericValue);
  }, [numericValue, displayValue]);

  return (
    <motion.span>
      {value.includes('+') ? (
        <>
          <motion.span>{display}</motion.span>+
        </>
      ) : value.includes('%') ? (
        <>
          <motion.span>{display}</motion.span>%
        </>
      ) : value.includes('/') ? (
        value
      ) : (
        <>
          <motion.span>{display}</motion.span>
          {suffix}
        </>
      )}
    </motion.span>
  );
}

// 3D Background Component with Mouse Interaction
function Animated3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        mouseX.set(x);
        mouseY.set(y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const rotateX = useTransform(mouseY, [0, 1], [-5, 5]);
  const rotateY = useTransform(mouseX, [0, 1], [-5, 5]);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        style={{
          backgroundSize: '200% 200%',
        }}
      />

      {/* Floating 3D Orbs */}
      {[
        { size: 400, x: -100, y: -100, color: 'from-blue-400/30 to-teal-400/30', delay: 0 },
        { size: 500, x: '80%', y: 200, color: 'from-purple-400/30 to-pink-400/30', delay: 2 },
        { size: 350, x: '50%', y: '70%', color: 'from-green-400/30 to-teal-400/30', delay: 4 },
        { size: 300, x: 100, y: '50%', color: 'from-blue-400/20 to-purple-400/20', delay: 1 },
      ].map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute bg-gradient-to-br ${orb.color} rounded-full blur-3xl`}
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            rotateX,
            rotateY,
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15 + index * 2,
            repeat: Infinity,
            delay: orb.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Animated Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// Text Reveal Animation Component
function TextReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing({ navigate }: LandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const stats = [
    { value: '10,000+', label: 'Happy Patients', icon: Heart },
    { value: '500+', label: 'Medical Experts', icon: Users },
    { value: '98%', label: 'Satisfaction Rate', icon: Award },
    { value: '24/7', label: 'Support Available', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden relative">
      <Animated3DBackground />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-blue-600 via-teal-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Stethoscope className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-teal-500 to-green-500 bg-clip-text text-transparent">
              MediConnect
            </span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Testimonials'].map((item, index) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-gray-700 hover:text-blue-600 transition-colors relative"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ y: -2 }}
              >
                {item}
                <motion.div
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600"
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </div>

          <div className="hidden md:flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('signin')}
              className="px-6 py-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              Sign In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(37, 99, 235, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('signup')}
              className="px-6 py-4 bg-gradient-to-r from-blue-600 via-teal-500 to-green-500 text-white rounded-lg shadow-lg relative overflow-hidden group"
            >
              <span className="relative z-10">Get Started</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-500 via-teal-500 to-blue-600"
                initial={{ x: '-100%' }}
                whileHover={{ x: '0%' }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-t border-gray-200 px-6 py-4 space-y-4"
          >
            {['Features', 'How It Works', 'Testimonials'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="block text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <button
              onClick={() => {
                navigate('signin');
                setMobileMenuOpen(false);
              }}
              className="w-full px-6 py-2 text-gray-700 hover:text-blue-600 transition-colors text-left"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                navigate('signup');
                setMobileMenuOpen(false);
              }}
              className="w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg"
            >
              Get Started
            </button>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, type: 'spring', stiffness: 50 }}
            >
              <TextReveal delay={0.2}>
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-teal-100 text-blue-700 rounded-full mb-6 border border-blue-200"
                  whileHover={{ scale: 1.05 }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Next-Gen Healthcare Platform</span>
                </motion.div>
              </TextReveal>

              <TextReveal delay={0.3}>
                <motion.h1
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Healthcare at Your{' '}
                  <motion.span
                    className="bg-gradient-to-r from-blue-600 via-teal-500 to-green-500 bg-clip-text text-transparent inline-block"
                    animate={{
                      backgroundPosition: ['0%', '100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    style={{
                      backgroundSize: '200%',
                    }}
                  >
                    Doorstep
                  </motion.span>
                </motion.h1>
              </TextReveal>

              <TextReveal delay={0.4}>
                <motion.p
                  className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Connect with medical professionals instantly. Get comprehensive health monitoring,
                  expert diagnosis, and personalized care—all from the comfort of your home.
                </motion.p>
              </TextReveal>

              <TextReveal delay={0.5}>
                <motion.div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(37, 99, 235, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('signup')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 via-teal-500 to-green-500 text-white rounded-xl shadow-2xl flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2 font-semibold">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-green-500 via-teal-500 to-blue-600"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '0%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05, borderColor: 'rgb(37, 99, 235)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-8 py-4 bg-white text-gray-700 rounded-xl border-2 border-gray-200 hover:text-blue-600 transition-all flex items-center justify-center gap-2 font-semibold"
                  >
                    Learn More
                    <ChevronDown className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </TextReveal>

              {/* Animated Stats */}
              <TextReveal delay={0.6}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ y: -8, scale: 1.05 }}
                      className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:border-blue-300 transition-all cursor-pointer group"
                    >
                      <motion.div
                        className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <stat.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent mb-1">
                        <AnimatedCounter value={stat.value} />
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </TextReveal>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring', stiffness: 50, delay: 0.2 }}
              className="relative"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="relative bg-gradient-to-br from-blue-500 via-teal-400 to-green-400 rounded-3xl p-8 shadow-2xl"
              >
                <div className="bg-white rounded-2xl p-6 space-y-4">
                  {[
                    { icon: Heart, title: 'Heart Rate', value: '72 BPM', status: 'Normal', color: 'blue' },
                    { icon: Activity, title: 'Blood Pressure', value: '120/80 mmHg', status: 'Optimal', color: 'teal' },
                    { icon: Shield, title: 'All Systems', value: 'Monitored', status: 'Healthy', color: 'green' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.15 }}
                      whileHover={{ scale: 1.02, x: 5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl cursor-pointer border border-gray-100 hover:border-blue-200 transition-all"
                    >
                      <motion.div
                        className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <item.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-600">
                          {item.value} - {item.status}
                        </div>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 bg-green-500 rounded-full"
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-30 blur-2xl"
              />
              <motion.div
                animate={{
                  y: [0, 20, 0],
                  rotate: [0, -5, 0],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-30 blur-2xl"
              />
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ opacity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 text-gray-400"
          >
            <span className="text-sm">Scroll to explore</span>
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-br from-gray-50 to-white relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-4"
            >
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Premium Features</span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">MediConnect?</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Experience healthcare reimagined with cutting-edge technology and personalized care
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Stethoscope,
                title: 'Patient-Centered Care',
                description: 'Personalized healthcare experience tailored to your unique needs',
                color: 'from-blue-600 to-blue-400',
                gradient: 'from-blue-50 to-blue-100',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Your health data protected with enterprise-grade security',
                color: 'from-teal-600 to-teal-400',
                gradient: 'from-teal-50 to-teal-100',
              },
              {
                icon: Clock,
                title: '24/7 Availability',
                description: 'Access medical assistance anytime, anywhere you need it',
                color: 'from-green-600 to-green-400',
                gradient: 'from-green-50 to-green-100',
              },
              {
                icon: Users,
                title: 'Expert Network',
                description: 'Connect with verified doctors and medical professionals',
                color: 'from-purple-600 to-purple-400',
                gradient: 'from-purple-50 to-purple-100',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -12, scale: 1.03 }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity blur-xl`} />
                <div className={`relative p-6 bg-gradient-to-br ${feature.gradient} rounded-2xl border border-gray-200 group-hover:border-transparent group-hover:shadow-2xl transition-all cursor-pointer h-full`}>
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              How It <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">Simple steps to better healthcare</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Calendar,
                title: 'Book Appointment',
                description: 'Choose your preferred medical assistant and schedule a visit at your convenience',
              },
              {
                step: '02',
                icon: Stethoscope,
                title: 'Get Examined',
                description: 'Professional medical assistant visits you for comprehensive health checkup',
              },
              {
                step: '03',
                icon: Award,
                title: 'Expert Diagnosis',
                description: 'Licensed doctors review your reports and provide personalized treatment plans',
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="text-center p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-xl transition-all"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.3, type: 'spring', stiffness: 200 }}
                    className="text-6xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text mb-4"
                  >
                    {step.step}
                  </motion.div>
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                  >
                    <step.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </motion.div>
                {index < 2 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 0.6 }}
                    className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-teal-500"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              What Our <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Patients Say</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">Real stories from real people</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Noman Shakir',
                role: 'Patient',
                content: 'MediConnect transformed how I manage my health. The convenience of home visits and expert consultations is unmatched!',
                rating: 4,
              },
              {
                name: 'Hasham Khalid',
                role: 'Patient',
                content: 'As someone with a busy schedule, MediConnect is a lifesaver. Professional service and accurate diagnoses every time.',
                rating: 5,
              },
              {
                name: 'Fahmia Khan',
                role: 'Patient',
                content: 'The platform is intuitive and the medical staff is incredibly professional. Highly recommend to anyone!',
                rating: 4,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + i * 0.1, type: 'spring' }}
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 via-teal-500 to-green-500 relative overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <Sparkles className="w-16 h-16 text-white" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8">
              Join thousands of patients already experiencing better health outcomes with MediConnect
            </p>
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('signup')}
              className="px-10 py-4 bg-white text-blue-600 rounded-xl shadow-2xl inline-flex items-center gap-2 relative overflow-hidden group font-semibold"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-100 to-teal-100"
                initial={{ x: '-100%' }}
                whileHover={{ x: '0%' }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="white" />
                </div>
                <span className="text-xl font-bold text-white">MediConnect</span>
              </div>
              <p className="text-sm leading-relaxed">Transforming healthcare delivery for a healthier tomorrow.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <motion.a
                href="mailto:ferdousgulzar543@gmail.com"
                className="flex items-center gap-2 text-sm hover:text-white transition-colors group mb-4"
                whileHover={{ x: 5 }}
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>ferdousgulzar543@gmail.com</span>
              </motion.a>
              <div className="flex gap-4 mt-4">
                {[Linkedin, Twitter, Github].map((Icon, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 MediConnect. All rights reserved. Transforming healthcare delivery.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
