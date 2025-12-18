import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwgnyerzimcajauxzowx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helper functions
export const db = {
  // Users table operations
  users: {
    // Create or update user profile
    upsertProfile: async (userId, profileData) => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
      return { data, error }
    },

    // Get user profile
    getProfile: async (userId) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return { data, error }
    },

    // Update user profile
    updateProfile: async (userId, updates) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
      return { data, error }
    }
  },

  // Trades table operations
  trades: {
    // Insert multiple trades
    insertTrades: async (trades) => {
      const { data, error } = await supabase
        .from('trades')
        .insert(trades)
        .select()
      return { data, error }
    },

    // Get trades for a user
    getTrades: async (userId, limit = 1000) => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('close_time', { ascending: false })
        .limit(limit)
      return { data, error }
    },

    // Delete trades for a user
    deleteTrades: async (userId) => {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', userId)
      return { error }
    }
  },

  // Leaderboard operations
  leaderboard: {
    // Get global leaderboard
    getGlobal: async (limit = 100) => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('trader_score', { ascending: false })
        .limit(limit)
      return { data, error }
    },

    // Update user leaderboard entry
    updateEntry: async (userId, metrics) => {
      const { data, error } = await supabase
        .from('leaderboard')
        .upsert({
          user_id: userId,
          ...metrics,
          updated_at: new Date().toISOString()
        })
        .select()
      return { data, error }
    }
  }
}
