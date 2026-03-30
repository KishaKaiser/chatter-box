import { useState } from "react"
import { User as UserIcon, Camera, Check } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { UserAccount } from "@/components/UserAccount"

interface ProfileSettingsProps {
  currentUser: UserAccount
  onUpdateProfile: (updatedUser: UserAccount) => void
}

const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily",
]

export function ProfileSettings({ currentUser, onUpdateProfile }: ProfileSettingsProps) {
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState(currentUser.displayName || currentUser.username)
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatarUrl || "")
  const [customAvatarUrl, setCustomAvatarUrl] = useState("")

  const handleSave = () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty")
      return
    }

    if (displayName.length < 2) {
      toast.error("Display name must be at least 2 characters")
      return
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      displayName: displayName.trim(),
      avatarUrl: selectedAvatar || undefined,
    }

    onUpdateProfile(updatedUser)
    toast.success("Profile updated successfully!")
    setOpen(false)
  }

  const handleCustomAvatarSubmit = () => {
    if (!customAvatarUrl.trim()) {
      toast.error("Please enter a valid URL")
      return
    }

    if (!customAvatarUrl.startsWith("http://") && !customAvatarUrl.startsWith("https://")) {
      toast.error("Avatar URL must start with http:// or https://")
      return
    }

    setSelectedAvatar(customAvatarUrl)
    setCustomAvatarUrl("")
    toast.success("Custom avatar added!")
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent/10 active:scale-95 transition-transform"
          title="Profile Settings"
        >
          <UserIcon size={18} weight="bold" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Profile Settings</DialogTitle>
          <DialogDescription>
            Customize your display name and avatar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              {selectedAvatar ? (
                <AvatarImage src={selectedAvatar} alt={displayName} />
              ) : (
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {getUserInitials(displayName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="text-center">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Enter display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-[15px]"
            />
          </div>

          <div className="space-y-3">
            <Label>Choose Avatar</Label>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_PRESETS.map((avatarUrl, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatarUrl)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                    selectedAvatar === avatarUrl
                      ? "border-accent shadow-lg"
                      : "border-border hover:border-accent/50"
                  }`}
                  title={`Avatar ${index + 1}`}
                >
                  <img
                    src={avatarUrl}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedAvatar === avatarUrl && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <div className="bg-accent rounded-full p-1">
                        <Check size={16} weight="bold" className="text-accent-foreground" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customAvatar">Or use custom URL</Label>
            <div className="flex gap-2">
              <Input
                id="customAvatar"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                className="flex-1 text-[15px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCustomAvatarSubmit()
                  }
                }}
              />
              <Button
                onClick={handleCustomAvatarSubmit}
                variant="outline"
                className="border-accent/50 text-accent hover:bg-accent/10"
                size="icon"
                title="Add custom avatar"
              >
                <Camera size={18} weight="bold" />
              </Button>
            </div>
          </div>

          {selectedAvatar && (
            <Button
              onClick={() => setSelectedAvatar("")}
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              Remove Avatar
            </Button>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-transform"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
