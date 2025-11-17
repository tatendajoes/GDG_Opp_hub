'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import { Database } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { User as UserIcon, MapPin, Shield, Lock, Calendar, Mail, GraduationCap, Globe, MapPinned, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

type UserRow = Database["public"]["Tables"]["users"]["Row"]

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState<User | null>(null)
  const [activeSection, setActiveSection] = useState<'basic' | 'location' | 'account'>('basic')

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [major, setMajor] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [birthday, setBirthday] = useState('')
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [state, setState] = useState('')

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const abortController = new AbortController()
    let isMounted = true

    async function fetchProfileData() {
      if (!user?.id) return

      try {
        setLoading(true)
        const supabase = createClient()

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single<UserRow>()

        if (userError) throw userError

        if (!isMounted) return

        if (userData) {
          setProfileData(userData)
          setName(userData.name || '')
          setEmail(userData.email || '')
          setMajor(userData.major || '')
          setGender(userData.gender || '')
          setBirthday(userData.birthday || '')
          setCountry(userData.country || '')
          setRegion(userData.region || '')
          setState(userData.state || '')
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        if (!isMounted) return

        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching profile data:', err)
        }
        toast.error('Failed to load profile data')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProfileData()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [user?.id])

  // Track changes
  useEffect(() => {
    if (!profileData) return
    
    const changed = 
      name !== (profileData.name || '') ||
      major !== (profileData.major || '') ||
      gender !== (profileData.gender || '') ||
      birthday !== (profileData.birthday || '') ||
      country !== (profileData.country || '') ||
      region !== (profileData.region || '') ||
      state !== (profileData.state || '')
    
    setHasChanges(changed)
  }, [name, major, gender, birthday, country, region, state, profileData])

  const handleSaveAll = async () => {
    if (!user?.id) return

    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    try {
      setSaving(true)
      const supabase = createClient()

      const updates: any = {
        name,
        major: major || null,
        gender: gender || null,
        birthday: birthday || null,
        country: country || null,
        region: region || null,
        state: state || null,
      }

      const { error } = await (supabase
        .from('users') as any)
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setProfileData(prev => prev ? { ...prev, ...updates } : null)
      setHasChanges(false)
      toast.success('Settings saved successfully!')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating profile:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast.success('Password reset email sent! Check your inbox.')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending password reset:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to send password reset email')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-2">
                <Button
                  onClick={() => router.back()}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                  <nav className="flex flex-col p-2">
                    <button
                      onClick={() => setActiveSection('basic')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        activeSection === 'basic'
                          ? 'bg-purple-50 text-purple-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <UserIcon className="w-5 h-5" />
                      <span>Personal Info</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('location')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        activeSection === 'location'
                          ? 'bg-purple-50 text-purple-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                      <span>Location</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('account')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        activeSection === 'account'
                          ? 'bg-purple-50 text-purple-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Shield className="w-5 h-5" />
                      <span>Account</span>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 pb-24">
                {/* Personal Information Section */}
                {activeSection === 'basic' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
                      <p className="text-gray-600">Update your personal details and profile information</p>
                    </div>

                    <div className="space-y-6">
                      {/* Name Field */}
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      {/* Major Field */}
                      <div>
                        <label htmlFor="major" className="block text-sm font-semibold text-gray-700 mb-2">
                          Major / Field of Study
                        </label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            id="major"
                            type="text"
                            value={major}
                            onChange={(e) => setMajor(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="e.g., Computer Science"
                          />
                        </div>
                      </div>

                      {/* Gender Field */}
                      <div>
                        <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          id="gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | '')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Birthday Field */}
                      <div>
                        <label htmlFor="birthday" className="block text-sm font-semibold text-gray-700 mb-2">
                          Birthday
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            id="birthday"
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Information Section */}
                {activeSection === 'location' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Information</h2>
                      <p className="text-gray-600">Let us know where you're based</p>
                    </div>

                    <div className="space-y-6">
                      {/* Country Field */}
                      <div>
                        <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                          Country
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select
                            id="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
                          >
                            <option value="">Select country</option>
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                            <option value="Germany">Germany</option>
                            <option value="France">France</option>
                            <option value="India">India</option>
                            <option value="China">China</option>
                            <option value="Japan">Japan</option>
                            <option value="Nigeria">Nigeria</option>
                            <option value="South Africa">South Africa</option>
                            <option value="Brazil">Brazil</option>
                            <option value="Mexico">Mexico</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Region/Province Field */}
                      <div>
                        <label htmlFor="region" className="block text-sm font-semibold text-gray-700 mb-2">
                          Region / Province
                        </label>
                        <div className="relative">
                          <MapPinned className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            id="region"
                            type="text"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="e.g., Ontario, California"
                          />
                        </div>
                      </div>

                      {/* State/City Field */}
                      <div>
                        <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                          State / City
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            id="state"
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="e.g., Toronto, Los Angeles"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Settings Section */}
                {activeSection === 'account' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h2>
                      <p className="text-gray-600">Manage your account security and preferences</p>
                    </div>

                    <div className="space-y-8">
                      {/* Email Field (Read-only) */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            id="email"
                            type="email"
                            value={email}
                            disabled
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Email cannot be changed at this time
                        </p>
                      </div>

                      {/* Role Display */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Account Role
                        </label>
                        <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold">
                          <Shield className="w-4 h-4 mr-2" />
                          {profileData?.role === 'admin' ? 'Admin' : 'Student'}
                        </div>
                      </div>

                      {/* Account Created */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Member Since
                        </label>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <span>
                            {profileData?.created_at
                              ? new Date(profileData.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200"></div>

                      {/* Password Section */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Password
                        </label>
                        <p className="text-gray-600 mb-4">
                          Manage your password and account security
                        </p>
                        <Button
                          onClick={handlePasswordReset}
                          variant="outline"
                          className="text-purple-600 border-purple-600 hover:bg-purple-50 hover:text-purple-700"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Save Button */}
        {(activeSection === 'basic' || activeSection === 'location') && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <span className="text-sm text-gray-600">
                      You have unsaved changes
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving || !hasChanges || !name.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
