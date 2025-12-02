// src/user-services/user.controllers.ts
import { Request, Response } from 'express'
import { UserService } from './user.services'
import { UserCreateDTO, UserLoginDTO, UserUpdateDTO } from './user.schema'
import * as jwt from 'jsonwebtoken'

const userService = new UserService()
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_prod'

// In-memory blacklist for tokens issued, used by /logout (not persistent)
const tokenBlacklist = new Set<string>()

export class UserController {
  /**
   * Register new user
   * POST /users/register
   */
  async register(req: Request, res: Response) {
    try {
      console.log('Register payload received:', req.body)
      const payload: UserCreateDTO = req.body

      // Validate required fields
      const { email, password, name, phone, role } = payload
      if (!email || !password || !name || !phone || !role) {
        return res.status(400).json({
          message: 'Missing required fields. Required: email, password, name, phone, role'
        })
      }

      // Validate role
      if (role !== 'User' && role !== 'CourtOwner') {
        return res.status(400).json({
          message: 'Invalid role. Must be either "User" or "CourtOwner"'
        })
      }

      const user = await userService.createUser(payload)
      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          created_at: user.created_at
        }
      })
    } catch (error: any) {
      console.error('UserController.register error:', error)
      const message = error?.message || 'Internal server error'
      
      if (message.includes('Email already exists')) {
        return res.status(409).json({ message })
      }
      if (message.includes('Invalid') || message.includes('required')) {
        return res.status(400).json({ message })
      }

      // If DB read failed (scans), return 503 so callers know it's a service/DB issue
      if (message.includes('Failed to fetch user by email') || message.toLowerCase().includes('dynamodb') || message.toLowerCase().includes('ec[on]nrefused') ) {
        return res.status(503).json({ message })
      }
      
      return res.status(500).json({ message })
    }
  }

  /**
   * Register customer (shorthand)
   * POST /register/customer
   */
  async registerCustomer(req: Request, res: Response) {
    try {
      const payload: UserCreateDTO = { ...(req.body || {}), role: 'User' }
      const user = await userService.createUser(payload)
      return res.status(201).json({ message: 'Customer registered successfully', user: { user_id: user.user_id, email: user.email, name: user.name, phone: user.phone, role: user.role, created_at: user.created_at } })
    } catch (error: any) {
      console.error('UserController.registerCustomer error:', error)
      const message = error?.message || 'Internal server error'
      if (message.includes('Email already exists')) return res.status(409).json({ message })
      if (message.includes('Invalid') || message.includes('required')) return res.status(400).json({ message })
      return res.status(500).json({ message })
    }
  }

  /**
   * Register owner (shorthand)
   * POST /register/owner
   */
  async registerOwner(req: Request, res: Response) {
    try {
      const payload: UserCreateDTO = { ...(req.body || {}), role: 'CourtOwner' }
      const user = await userService.createUser(payload)
      return res.status(201).json({ message: 'Owner registered successfully', user: { user_id: user.user_id, email: user.email, name: user.name, phone: user.phone, role: user.role, created_at: user.created_at } })
    } catch (error: any) {
      console.error('UserController.registerOwner error:', error)
      const message = error?.message || 'Internal server error'
      if (message.includes('Email already exists')) return res.status(409).json({ message })
      if (message.includes('Invalid') || message.includes('required')) return res.status(400).json({ message })
      return res.status(500).json({ message })
    }
  }

  /**
   * Logout - invalidate token (best-effort using in-memory blacklist)
   * POST /logout
   */
  async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization || ''
      const token = authHeader.replace('Bearer ', '') || (req.body && req.body.token)

      if (!token) return res.status(400).json({ message: 'No token provided' })

      tokenBlacklist.add(token)
      return res.status(200).json({ message: 'Logged out successfully' })
    } catch (error: any) {
      console.error('UserController.logout error:', error)
      return res.status(500).json({ message: error?.message || 'Internal server error' })
    }
  }

  /**
   * User login
   * POST /users/login
   */
  async login(req: Request, res: Response) {
    try {
      console.log('Login attempt for:', req.body.email)
      const { email, password }: UserLoginDTO = req.body

      if (!email || !password) {
        return res.status(400).json({
          message: 'Email and password are required'
        })
      }

      const user = await userService.verifyLogin(email, password)
      
      if (!user) {
        return res.status(401).json({
          message: 'Invalid email or password'
        })
      }

      // Generate JWT token
      const payload = { user_id: user.user_id, role: user.role, email: user.email }
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' })

      return res.status(200).json({
        message: 'Login successful',
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role
        },
        token
      })
    } catch (error: any) {
      console.error('UserController.login error:', error)
      const message = error?.message || 'Internal server error'
      
      if (message.includes('inactive') || message.includes('banned')) {
        return res.status(403).json({ message })
      }
      
      return res.status(500).json({ message })
    }
  }

  /**
   * Get user by ID
   * GET /users/:user_id
   */
  async getUser(req: Request, res: Response) {
    try {
      const user_id = req.params.user_id as string
      console.log('Fetching user:', user_id)

      if (!user_id) {
        return res.status(400).json({ message: 'user_id is required' })
      }

      const user = await userService.getUserById(user_id)
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user as any
      return res.status(200).json(userWithoutPassword)
    } catch (error: any) {
      console.error('UserController.getUser error:', error)
      return res.status(500).json({ message: error.message })
    }
  }

  /**
   * Get all users with optional filters
   * GET /users
   * Query params: role, status, email
   */
  async getAllUsers(req: Request, res: Response) {
    try {
      const { role, status, email } = req.query

      const filters: any = {}
      if (role) filters.role = role
      if (status) filters.status = status
      if (email) filters.email = email

      console.log('Fetching users with filters:', filters)
      const users = await userService.getAllUsers(filters)

      // Remove passwords from response
      const usersWithoutPasswords = users.map((user: any) => {
        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
      })

      return res.status(200).json({
        count: usersWithoutPasswords.length,
        users: usersWithoutPasswords
      })
    } catch (error: any) {
      console.error('UserController.getAllUsers error:', error)
      return res.status(500).json({ message: error.message })
    }
  }

  /**
   * Update user profile
   * PUT /users/:user_id
   */
  async updateUser(req: Request, res: Response) {
    try {
      const user_id = req.params.user_id as string
      const updates: UserUpdateDTO = req.body

      console.log('Updating user:', user_id, 'with:', updates)

      if (!user_id) {
        return res.status(400).json({ message: 'user_id is required' })
      }

      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No update fields provided' })
      }

      const updatedUser = await userService.updateUser(user_id, updates)

      // Don't return password
      const { password, ...userWithoutPassword } = updatedUser as any
      return res.status(200).json({
        message: 'User updated successfully',
        user: userWithoutPassword
      })
    } catch (error: any) {
      console.error('UserController.updateUser error:', error)
      const message = error?.message || 'Internal server error'
      
      if (message.includes('not found')) {
        return res.status(404).json({ message })
      }
      if (message.includes('Invalid') || message.includes('already exists')) {
        return res.status(400).json({ message })
      }
      
      return res.status(500).json({ message })
    }
  }

  /**
   * Delete user (soft delete)
   * DELETE /users/:user_id
   */
  async deleteUser(req: Request, res: Response) {
    try {
      const user_id = req.params.user_id as string
      console.log('Deleting user:', user_id)

      if (!user_id) {
        return res.status(400).json({ message: 'user_id is required' })
      }

      await userService.deleteUser(user_id)
      return res.status(200).json({
        message: 'User deleted successfully (soft delete)'
      })
    } catch (error: any) {
      console.error('UserController.deleteUser error:', error)
      const message = error?.message || 'Internal server error'
      
      if (message.includes('not found')) {
        return res.status(404).json({ message })
      }
      
      return res.status(500).json({ message })
    }
  }

  /**
   * Get user profile (for authenticated user)
   * GET /users/profile
   * Note: In production, extract user_id from JWT token
   */
  async getProfile(req: Request, res: Response) {
    try {
      // Try to extract user_id from JWT token in Authorization header, otherwise fallback to query param
      let user_id = ''
      const authHeader = req.headers.authorization || ''
      const token = authHeader.replace('Bearer ', '') || ''
      if (token) {
        if (tokenBlacklist.has(token)) {
          return res.status(401).json({ message: 'Token invalid (logged out)' })
        }

        try {
          const decoded: any = jwt.verify(token, JWT_SECRET)
          user_id = decoded?.user_id
        } catch (err: any) {
          // invalid token, ignore and fallback
          console.warn('Invalid token provided to getProfile:', err?.message)
        }
      }

      if (!user_id) user_id = req.query.user_id as string

      if (!user_id) {
        return res.status(400).json({ message: 'user_id is required (or provide a valid Authorization token)' })
      }

      const user = await userService.getUserById(user_id)
      if (!user) return res.status(404).json({ message: 'User not found' })

      const { password, ...userWithoutPassword } = user as any
      return res.status(200).json(userWithoutPassword)
    } catch (error: any) {
      console.error('UserController.getProfile error:', error)
      return res.status(500).json({ message: error.message })
    }
  }

  /**
   * Update profile for authenticated user
   * PUT /user/profile
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization || ''
      const token = authHeader.replace('Bearer ', '') || ''

      if (!token) return res.status(401).json({ message: 'Authorization token required' })
      if (tokenBlacklist.has(token)) return res.status(401).json({ message: 'Token invalid (logged out)' })

      let user_id = ''
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET)
        user_id = decoded?.user_id
      } catch (err: any) {
        return res.status(401).json({ message: 'Invalid token' })
      }

      if (!user_id) return res.status(400).json({ message: 'Could not determine user from token' })

      const updates: UserUpdateDTO = req.body
      if (!updates || Object.keys(updates).length === 0) return res.status(400).json({ message: 'No update fields provided' })

      const updatedUser = await userService.updateUser(user_id, updates)
      const { password, ...userWithoutPassword } = updatedUser as any
      return res.status(200).json({ message: 'Profile updated successfully', user: userWithoutPassword })
    } catch (error: any) {
      console.error('UserController.updateProfile error:', error)
      const message = error?.message || 'Internal server error'
      if (message.includes('not found')) return res.status(404).json({ message })
      if (message.includes('Invalid') || message.includes('already exists')) return res.status(400).json({ message })
      return res.status(500).json({ message })
    }
  }
}
