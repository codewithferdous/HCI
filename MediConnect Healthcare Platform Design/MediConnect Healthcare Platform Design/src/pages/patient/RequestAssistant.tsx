import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, User, Phone, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';

interface RequestAssistantProps {
  navigate: (route: string) => void;
  onLogout: () => void;
}

export default function RequestAssistant({ navigate, onLogout }: RequestAssistantProps) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    address: '',
    phone: '',
    symptoms: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      navigate('patient-dashboard');
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <DashboardLayout userRole="patient" userName="John Smith" onLogout={onLogout} navigate={navigate}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Your request has been received. A medical assistant will be assigned shortly and will contact you to confirm the appointment.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 text-blue-700">
              You will be notified via SMS and email once a medical assistant accepts your request.
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="patient" userName="John Smith" onLogout={onLogout} navigate={navigate}>
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Medical Assistant</h1>
            <p className="text-gray-600">Schedule a home visit for health checkup and vitals recording</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date and Time */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Preferred Time
                  </label>
                  <select
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select time slot</option>
                    <option value="08:00 AM">08:00 AM - 10:00 AM</option>
                    <option value="10:00 AM">10:00 AM - 12:00 PM</option>
                    <option value="12:00 PM">12:00 PM - 02:00 PM</option>
                    <option value="02:00 PM">02:00 PM - 04:00 PM</option>
                    <option value="04:00 PM">04:00 PM - 06:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Home Address
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your complete address with landmarks"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Current Symptoms (Optional)
                </label>
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Describe any symptoms or health concerns you'd like to discuss"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2">What to expect:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Medical assistant will arrive at your scheduled time</li>
                  <li>• Complete health checkup including BP, Sugar, ECG, and Heart Rate</li>
                  <li>• All readings will be uploaded to your medical record</li>
                  <li>• Reports will be reviewed by our doctors within 24 hours</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('patient-dashboard')}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}