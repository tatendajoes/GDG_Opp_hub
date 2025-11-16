'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Briefcase, Calendar, GraduationCap, Mail, Settings, User as UserIcon, Camera, Upload } from 'lucide-react'
import { format } from 'date-fns'
import ProfileDropdown from '@/components/layout/ProfileDropdown'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<User | null>(null)
  const [opportunitiesCount, setOpportunitiesCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const abortController = new AbortController()
    let isMounted = true

    async function fetchProfileData() {
      if (!user?.id) return

      try {
        setLoading(true)
        const supabase = createClient()

        // Fetch user profile from users table
        const { data: userData, error: userError } = await (supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .abortSignal(abortController.signal)
          .single() as any)

        if (userError) throw userError

        // Fetch count of opportunities submitted by this user
        const { count, error: countError } = await supabase
          .from('opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('submitted_by', user.id)
          .abortSignal(abortController.signal)

        if (countError && process.env.NODE_ENV === 'development') {
          console.error('Error fetching opportunities count:', countError)
        }

        if (!isMounted) return

        setProfileData(userData)
        setOpportunitiesCount(count || 0)
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return

        if (!isMounted) return

        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching profile data:', err)
        }
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
  }, [user?.id, user?.email])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy')
    } catch {
      return 'N/A'
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      const supabase = createClient()

      // Create unique file name with user ID
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      // Delete old avatar if exists
      if (profileData?.avatar_url) {
        const oldPath = profileData.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const publicUrl = data.publicUrl

      // Update user profile with avatar URL
      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      toast.success('Profile picture updated successfully!')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error uploading avatar:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to upload profile picture')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.back()}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-purple-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  My Profile
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push('/settings')}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-6 border border-gray-200">
              {/* Avatar and Name Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                {/* Avatar */}
                <div className="flex-shrink-0 relative group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {profileData?.avatar_url ? (
                    <div className="relative">
                      <img
                        src={profileData.avatar_url}
                        alt={profileData.name}
                        className="w-24 h-24 rounded-full object-cover shadow-lg"
                      />
                      <button
                        onClick={handleAvatarClick}
                        disabled={uploading}
                        className="absolute inset-0 w-24 h-24 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-200 cursor-pointer"
                        title="Change profile picture"
                      >
                        <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAvatarClick}
                      disabled={uploading}
                      className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-200 cursor-pointer"
                      title="Upload profile picture"
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <UserIcon className="w-12 h-12 group-hover:opacity-50 transition-opacity duration-200" />
                          <Upload className="w-8 h-8 absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </>
                      )}
                    </button>
                  )}
                  {uploading && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <p className="text-xs text-gray-500">Uploading...</p>
                    </div>
                  )}
                </div>

                {/* Name and Role */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {profileData?.name || 'User'}
                  </h2>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                      {profileData?.role === 'admin' ? 'Admin' : 'Student'}
                    </span>
                    {profileData?.major && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {profileData.major}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Email Address</p>
                    <p className="text-gray-900 font-medium break-all">{profileData?.email || user?.email || 'N/A'}</p>
                  </div>
                </div>

                {/* Major */}
                {profileData?.major && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Major</p>
                      <p className="text-gray-900 font-medium">{profileData.major}</p>
                    </div>
                  </div>
                )}

                {/* Account Created */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Member Since</p>
                    <p className="text-gray-900 font-medium">{formatDate(profileData?.created_at || null)}</p>
                  </div>
                </div>

                {/* Opportunities Submitted */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Opportunities Submitted</p>
                    <p className="text-gray-900 font-medium text-2xl">{opportunitiesCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Your Contribution</h3>
              <p className="text-purple-100">
                Thank you for being part of the GDG Opportunities Hub community!
                {opportunitiesCount > 0
                  ? ` You have shared ${opportunitiesCount} ${opportunitiesCount === 1 ? 'opportunity' : 'opportunities'} with fellow students.`
                  : ' Share your first opportunity today!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
