import Database from 'better-sqlite3'
import { join } from 'path'
import { randomBytes, pbkdf2Sync } from 'crypto'

// Database setup
const dbPath = join(process.cwd(), 'data', 'app.db')
const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
`)

// Types
export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  salt: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: number
  expires_at: string
  created_at: string
}

export interface SafeUser {
  id: number
  name: string
  email: string
  created_at: string
}

// Password hashing utilities
function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
}

function generateSalt(): string {
  return randomBytes(32).toString('hex')
}

function generateSessionId(): string {
  return randomBytes(32).toString('hex')
}

// User functions
export function createUser(name: string, email: string, password: string): SafeUser {
  const salt = generateSalt()
  const passwordHash = hashPassword(password, salt)

  const stmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, salt)
    VALUES (?, ?, ?, ?)
  `)

  const result = stmt.run(name, email.toLowerCase(), passwordHash, salt)

  return {
    id: result.lastInsertRowid as number,
    name,
    email: email.toLowerCase(),
    created_at: new Date().toISOString()
  }
}

export function findUserByEmail(email: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
  return stmt.get(email.toLowerCase()) as User | undefined
}

export function findUserById(id: number): SafeUser | undefined {
  const stmt = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?')
  return stmt.get(id) as SafeUser | undefined
}

export function verifyPassword(user: User, password: string): boolean {
  const hash = hashPassword(password, user.salt)
  return hash === user.password_hash
}

// Session functions
export function createSession(userId: number): Session {
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `)

  stmt.run(sessionId, userId, expiresAt.toISOString())

  return {
    id: sessionId,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString()
  }
}

export function findSessionById(sessionId: string): Session | undefined {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > datetime(\'now\')')
  return stmt.get(sessionId) as Session | undefined
}

export function deleteSession(sessionId: string): void {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?')
  stmt.run(sessionId)
}

export function deleteExpiredSessions(): void {
  const stmt = db.prepare('DELETE FROM sessions WHERE expires_at <= datetime(\'now\')')
  stmt.run()
}

export function deleteUserSessions(userId: number): void {
  const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?')
  stmt.run(userId)
}

export { db }
