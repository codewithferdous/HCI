import { CheckCircle2, Circle, AlertCircle, ExternalLink } from 'lucide-react';

interface SetupInstructionsProps {
  onDismiss?: () => void;
}

export default function SetupInstructions({ onDismiss }: SetupInstructionsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8" />
            <h1 className="text-2xl">Database Setup Required</h1>
          </div>
          <p className="text-blue-100">
            MediConnect needs database configuration to work. Follow these 3 simple steps:
          </p>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-6">
          {/* Step 1 */}
          <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-2 text-gray-900">Run SQL Migration</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>1. Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    Supabase Dashboard <ExternalLink className="w-3 h-3" />
                  </a></p>
                  <p>2. Go to <span className="font-semibold text-gray-800">SQL Editor</span> → New Query</p>
                  <p>3. Copy all SQL from <code className="bg-gray-100 px-2 py-1 rounded text-xs">/supabase/migrations/001_mediconnect_complete.sql</code></p>
                  <p>4. Paste and click <span className="font-semibold text-gray-800">RUN</span></p>
                </div>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    ✅ Creates all database tables, policies, and test accounts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-2 text-gray-900">Create Storage Buckets</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>1. In Supabase, go to <span className="font-semibold text-gray-800">Storage</span></p>
                  <p>2. Create bucket: <code className="bg-gray-100 px-2 py-1 rounded text-xs">documents</code> (✅ Public)</p>
                  <p>3. Create bucket: <code className="bg-gray-100 px-2 py-1 rounded text-xs">reports</code> (✅ Public)</p>
                </div>
                <div className="mt-3 bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <p className="text-xs text-teal-800">
                    ✅ Enables document uploads during signup and medical report uploads
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-2 text-gray-900">Set Test Account Passwords</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>1. In Supabase, go to <span className="font-semibold text-gray-800">Authentication</span> → Users</p>
                  <p>2. For each test user, click → Update user → Set password</p>
                  <p className="text-xs text-gray-500 ml-4">Suggested password: <code className="bg-gray-100 px-2 py-1 rounded">password123</code></p>
                </div>
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-xs text-green-800 space-y-1">
                    <p className="font-semibold mb-1">Test Accounts:</p>
                    <p>• admin@mediconnect.com (Admin)</p>
                    <p>• dr.smith@mediconnect.com (Doctor)</p>
                    <p>• assistant@mediconnect.com (Assistant)</p>
                    <p>• patient@mediconnect.com (Patient)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 px-6 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Open Supabase Dashboard
              <ExternalLink className="w-4 h-4" />
            </a>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                I'll do this later
              </button>
            )}
          </div>

          {/* Help */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              💡 <span className="font-semibold">Need detailed instructions?</span> Check the <code className="bg-white px-2 py-1 rounded text-xs">/SETUP_NOW.md</code> file in your project files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
