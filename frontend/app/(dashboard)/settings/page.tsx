'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import { Database } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/layout/Navbar'
import PageHeader from '@/components/layout/PageHeader'
import toast from 'react-hot-toast'

type UserRow = Database["public"]["Tables"]["users"]["Row"]

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState<User | null>(null)
  const [activeSection, setActiveSection] = useState<'basic' | 'account'>('basic')

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [major, setMajor] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [birthday, setBirthday] = useState('')
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [state, setState] = useState('')

  // Edit states for each field
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState('')

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

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setTempValue(currentValue)
  }

  const handleCancel = () => {
    setEditingField(null)
    setTempValue('')
  }

  const handleSave = async (field: string) => {
    if (!user?.id) return

    try {
      setSaving(true)
      const supabase = createClient()

      const updates: any = {}

      if (field === 'name') {
        if (!tempValue.trim()) {
          toast.error('Name cannot be empty')
          return
        }
        updates.name = tempValue
        setName(tempValue)
      } else if (field === 'major') {
        updates.major = tempValue || null
        setMajor(tempValue)
      } else if (field === 'gender') {
        updates.gender = tempValue || null
        setGender(tempValue as 'male' | 'female' | 'other' | '')
      } else if (field === 'birthday') {
        updates.birthday = tempValue || null
        setBirthday(tempValue)
      } else if (field === 'country') {
        updates.country = tempValue || null
        setCountry(tempValue)
      } else if (field === 'region') {
        updates.region = tempValue || null
        setRegion(tempValue)
      } else if (field === 'state') {
        updates.state = tempValue || null
        setState(tempValue)
      }

      const { error } = await (supabase
        .from('users') as any)
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setProfileData(prev => prev ? { ...prev, ...updates } : null)
      setEditingField(null)
      setTempValue('')
      toast.success('Updated successfully!')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating profile:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to update')
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
        <Navbar />
        <PageHeader title="Settings" />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar Navigation */}
              <div className="md:w-64 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  <nav className="flex flex-col">
                    <button
                      onClick={() => setActiveSection('basic')}
                      className={`px-4 py-3 text-left font-medium transition-colors ${
                        activeSection === 'basic'
                          ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Basic Info
                    </button>
                    <button
                      onClick={() => setActiveSection('account')}
                      className={`px-4 py-3 text-left font-medium transition-colors ${
                        activeSection === 'account'
                          ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Account
                    </button>
                  </nav>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 md:p-8">
                  {/* Basic Information Section */}
                  {activeSection === 'basic' && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Info</h2>
                      </div>

                      <div className="space-y-6">
                        {/* Name Field */}
                        <div className="border-b border-gray-200 pb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-600 mb-2">
                                Name
                              </label>
                              {editingField === 'name' ? (
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Your full name"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleSave('name')}
                                      disabled={saving || !tempValue.trim()}
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                      onClick={handleCancel}
                                      disabled={saving}
                                      size="sm"
                                      variant="outline"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className={name ? "text-gray-900" : "text-gray-400"}>{name || 'Not set'}</p>
                              )}
                            </div>
                            {editingField !== 'name' && (
                              <Button
                                onClick={() => handleEdit('name', name)}
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Major Field */}
                        <div className="border-b border-gray-200 pb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-600 mb-2">
                                Major
                              </label>
                              {editingField === 'major' ? (
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Computer Science"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleSave('major')}
                                      disabled={saving}
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                      onClick={handleCancel}
                                      disabled={saving}
                                      size="sm"
                                      variant="outline"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className={major ? "text-gray-900" : "text-gray-400"}>{major || 'Add your major'}</p>
                              )}
                            </div>
                            {editingField !== 'major' && (
                              <Button
                                onClick={() => handleEdit('major', major)}
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Gender Field */}
                        <div className="border-b border-gray-200 pb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-600 mb-2">
                                Gender
                              </label>
                              {editingField === 'gender' ? (
                                <div className="space-y-3">
                                  <select
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    autoFocus
                                  >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                  </select>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleSave('gender')}
                                      disabled={saving}
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                      onClick={handleCancel}
                                      disabled={saving}
                                      size="sm"
                                      variant="outline"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className={gender ? "text-gray-900 capitalize" : "text-gray-400"}>
                                  {gender || 'Not specified'}
                                </p>
                              )}
                            </div>
                            {editingField !== 'gender' && (
                              <Button
                                onClick={() => handleEdit('gender', gender)}
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Birthday Field */}
                        <div className="border-b border-gray-200 pb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-600 mb-2">
                                Birthday
                              </label>
                              {editingField === 'birthday' ? (
                                <div className="space-y-3">
                                  <input
                                    type="date"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleSave('birthday')}
                                      disabled={saving}
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                      onClick={handleCancel}
                                      disabled={saving}
                                      size="sm"
                                      variant="outline"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className={birthday ? "text-gray-900" : "text-gray-400"}>
                                  {birthday ? new Date(birthday).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  }) : 'Not set'}
                                </p>
                              )}
                            </div>
                            {editingField !== 'birthday' && (
                              <Button
                                onClick={() => handleEdit('birthday', birthday)}
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Country Field */}
                        <div className="border-b border-gray-200 pb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-600 mb-2">
                                Country
                              </label>
                              {editingField === 'country' ? (
                                <div className="space-y-3">
                                  <select
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    autoFocus
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
                                    <option value="Other">Other</option>
                                  </select>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleSave('country')}
                                      disabled={saving}
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                      onClick={handleCancel}
                                      disabled={saving}
                                      size="sm"
                                      variant="outline"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className={country ? "text-gray-900" : "text-gray-400"}>
                                  {country || 'Not specified'}
                                </p>
                              )}
                            </div>
                            {editingField !== 'country' && (
                              <Button
                                onClick={() => handleEdit('country', country)}
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Region Field */}
                        <div className="border-b border-gray-200 pb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-600 mb-2">
                                Region/Province
                              </label>
                              {editingField === 'region' ? (
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Ontario, California"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleSave('region')}
                                      disabled={saving}
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                      onClick={handleCancel}
                                      disabled={saving}
                                      size="sm"
                                      variant="outline"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className={region ? "text-gray-900" : "text-gray-400"}>
                                  {region || 'Not specified'}
                                </p>
                              )}
                            </div>
                            {editingField !== 'region' && (
                              <Button
                                onClick={() => handleEdit('region', region)}
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* State Field */}
                        <div className="pb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-600 mb-2">
                                State/City
                              </label>
                              {editingField === 'state' ? (
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Toronto, Los Angeles"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleSave('state')}
                                      disabled={saving}
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                      onClick={handleCancel}
                                      disabled={saving}
                                      size="sm"
                                      variant="outline"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className={state ? "text-gray-900" : "text-gray-400"}>
                                  {state || 'Not specified'}
                                </p>
                              )}
                            </div>
                            {editingField !== 'state' && (
                              <Button
                                onClick={() => handleEdit('state', state)}
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Account Section */}
                  {activeSection === 'account' && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h2>
                        <p className="text-gray-600">Manage your account preferences</p>
                      </div>

                      <div className="space-y-6">
                        {/* Email Field (Read-only) */}
                        <div>
                          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={email}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            Email cannot be changed at this time
                          </p>
                        </div>

                        {/* Role Display */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Account Role
                          </label>
                          <div className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                            {profileData?.role === 'admin' ? 'Admin' : 'Student'}
                          </div>
                        </div>

                        {/* Account Created */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Account Created
                          </label>
                          <p className="text-gray-600">
                            {profileData?.created_at
                              ? new Date(profileData.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'N/A'}
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200 my-6"></div>

                        {/* Password Section */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Password
                          </label>
                          <p className="text-gray-600 mb-3">
                            Manage your password and account security
                          </p>
                          <Button
                            onClick={handlePasswordReset}
                            variant="outline"
                            size="sm"
                            className="text-purple-600 border-purple-600 hover:bg-purple-50"
                          >
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
        </div>
      </div>
    </ProtectedRoute>
  )
}
