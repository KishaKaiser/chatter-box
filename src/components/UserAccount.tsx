import { useState } from "react"
import { useKV } from "@github/spark/hooks"
import { SignIn, SignOut, User as UserIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

export interface UserAccount {
  id: string
  username: string
  email: string
  createdAt: number
  displayName?: string
  avatarUrl?: string
}

interface UserAccountProps {
  currentUser: UserAccount | null
  onLogin: (user: UserAccount) => void
  onLogout: () => void
}

export function UserAccount({ currentUser, onLogin, onLogout }: UserAccountProps) {
  const [allAccounts, setAllAccounts] = useKV<UserAccount[]>("user-accounts", [])
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [open, setOpen] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password")
      return
    }

    const accounts = allAccounts || []
    const existingUser = accounts.find(
      (acc) => acc.email.toLowerCase() === email.toLowerCase()
    )

    if (!existingUser) {
      toast.error("Account not found. Please sign up first.")
      return
    }

    onLogin(existingUser)
    toast.success(`Welcome back, ${existingUser.username}!`)
    setOpen(false)
    resetForm()
  }

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters")
      return
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    const accounts = allAccounts || []
    const emailExists = accounts.some(
      (acc) => acc.email.toLowerCase() === email.toLowerCase()
    )

    if (emailExists) {
      toast.error("An account with this email already exists")
      return
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: username.trim(),
      email: email.toLowerCase().trim(),
      createdAt: Date.now(),
    }

    setAllAccounts((current) => [...(current || []), newUser])
    onLogin(newUser)
    toast.success(`Account created! Welcome, ${newUser.username}!`)
    setOpen(false)
    resetForm()
  }

  const handleLogout = () => {
    onLogout()
    toast.success("Logged out successfully")
  }

  const resetForm = () => {
    setUsername("")
    setEmail("")
    setPassword("")
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    resetForm()
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (currentUser) {
    const displayName = currentUser.displayName || currentUser.username
    
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
          <Avatar className="h-7 w-7 bg-primary/20">
            {currentUser.avatarUrl ? (
              <AvatarImage src={currentUser.avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
              {getUserInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{displayName}</span>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive/10 active:scale-95 transition-transform gap-2"
          size="sm"
        >
          <SignOut size={18} weight="bold" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-accent/50 text-accent hover:bg-accent/10 active:scale-95 transition-transform gap-2"
          size="sm"
        >
          <SignIn size={18} weight="bold" />
          <span>Login</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </DialogTitle>
          <DialogDescription>
            {isLoginMode
              ? "Login to access your conversations and knowledge base"
              : "Sign up to save your conversations across sessions"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isLoginMode && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <UserIcon
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  autoComplete="username"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={isLoginMode ? "Enter password" : "Create a password (min 6 characters)"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLoginMode ? "current-password" : "new-password"}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  isLoginMode ? handleLogin() : handleSignup()
                }
              }}
            />
          </div>

          <Button
            onClick={isLoginMode ? handleLogin : handleSignup}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-transform"
          >
            {isLoginMode ? "Login" : "Sign Up"}
          </Button>

          <div className="text-center text-sm">
            <button
              onClick={toggleMode}
              className="text-accent hover:underline focus:outline-none"
            >
              {isLoginMode
                ? "Don't have an account? Sign up"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
