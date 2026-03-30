# Planning Guide

A conversational AI chatbot that learns from user-uploaded documents and images to provide intelligent, context-aware responses.

**Experience Qualities**:
1. **Intelligent** - The bot should feel smart and contextually aware, learning from uploaded materials to provide relevant answers
2. **Conversational** - Interactions should flow naturally like a real conversation with smooth back-and-forth exchanges
3. **Accessible** - Simple, intuitive interface that makes uploading content and chatting effortless for any user

**Complexity Level**: Light Application (multiple features with basic state)
This is a chat interface with file upload capabilities and conversational AI - it has multiple interactive features (chat, file uploads, knowledge base management) but maintains a focused, streamlined purpose around conversational interaction.

## Essential Features

**Document & Image Upload**
- Functionality: Users can upload various file types including documents (PDF, TXT, MD), images (PNG, JPG), ZIP archives, and code files (JS, TS, PY, JAVA, etc.)
- Purpose: Builds the bot's knowledge base so it can answer questions based on uploaded content
- Trigger: Click upload button or drag-and-drop files into designated area
- Progression: Select file → Upload with visual feedback → File processes → Added to knowledge base → Confirmation message
- Success criteria: File uploads successfully, content is extractable, bot can reference this content in responses

**Conversational Chat Interface**
- Functionality: Real-time chat where users type messages and receive AI-generated responses
- Purpose: Primary interaction method for asking questions and getting answers based on learned content
- Trigger: User types message and presses enter or clicks send
- Progression: Type message → Submit → Bot shows typing indicator → Response appears → Continues conversation
- Success criteria: Messages send instantly, responses arrive within 3 seconds, conversation history persists

**Voice Input Support**
- Functionality: Hands-free message input using speech recognition with real-time transcription
- Purpose: Enables accessible, convenient messaging without typing, perfect for hands-free scenarios
- Trigger: Click microphone button to start/stop recording
- Progression: Click mic → Permission granted → Speak message → Live transcription updates input field → Click mic again or wait → Message sent automatically
- Success criteria: Speech accurately transcribed in real-time, visual feedback shows recording state, seamless send on completion, browser compatibility gracefully handled

**Text-to-Speech for Bot Responses**
- Functionality: Bot messages can be read aloud using speech synthesis with play/stop controls
- Purpose: Enables hands-free consumption of responses, improves accessibility, creates more natural conversational experience
- Trigger: Click speaker button on any bot message
- Progression: Click speaker icon → Speech synthesis starts → Icon animates while speaking → Click again to stop → Returns to ready state
- Success criteria: Natural-sounding voice reads full message, visual feedback shows speaking state, can stop mid-speech, works across browsers with Web Speech API support

**Knowledge Base Display**
- Functionality: Visual list showing all uploaded documents/images with ability to remove items
- Purpose: Gives users visibility and control over what the bot has learned
- Trigger: Automatically displays when files are uploaded
- Progression: Upload file → Appears in knowledge list → Click remove icon → Confirms deletion → Updates bot's knowledge
- Success criteria: List accurately reflects uploaded content, removal works immediately, bot stops referencing deleted content

**Context-Aware Responses**
- Functionality: Bot analyzes uploaded content and provides answers based on that knowledge
- Purpose: Makes the bot useful and personalized to user's specific documents
- Trigger: User asks question that relates to uploaded content
- Progression: User asks question → Bot searches knowledge base → Finds relevant content → Generates answer with context
- Success criteria: Bot correctly references uploaded content, cites sources when relevant, admits when it doesn't know

**Conversation History Export**
- Functionality: Download complete conversation history with timestamps in text or JSON format
- Purpose: Enables users to save, share, and archive important conversations for future reference or documentation
- Trigger: Click export button in header (only visible when messages exist)
- Progression: Click export button → Select format (Text or JSON) → File downloads automatically → Success confirmation
- Success criteria: Export includes all messages with accurate timestamps, proper formatting, and unique filenames

**User Account Management**
- Functionality: Create and login to user accounts where each user's data is stored separately
- Purpose: Enables multiple users to have personalized experiences with their own conversations and knowledge bases
- Trigger: Click login button in header
- Progression: Click login → Choose signup or login → Enter credentials → Authenticate → Account created/logged in → User-specific data loads
- Success criteria: Users can create accounts, login/logout, and their messages and knowledge files are isolated per user

## Edge Case Handling
- **Empty Chat State**: Display welcoming message with upload prompt when no files have been added yet
- **Unsupported File Types**: Show error toast explaining which file types are supported
- **Large File Uploads**: Display progress indicator for files over 1MB, show error for files exceeding 10MB limit
- **No Knowledge Base**: Bot responds helpfully but indicates it has no custom knowledge to reference
- **Rapid Messages**: Queue messages if user sends multiple quickly, process in order
- **Failed Uploads**: Clear error message with retry option if upload fails
- **Network Issues**: Show connection status, cache messages to send when reconnected
- **Voice Input Unsupported**: Show error toast if browser doesn't support Web Speech API
- **Microphone Permissions**: Handle denied permissions gracefully with helpful message
- **Voice Recognition Errors**: Display error feedback if speech recognition fails mid-recording
- **Noisy Environments**: Continue transcription despite background noise, allow manual editing of transcript
- **Text-to-Speech Unsupported**: Hide speaker buttons if browser doesn't support Speech Synthesis API
- **Multiple Messages Speaking**: Stop previous message when starting to speak a new one
- **Empty Conversation Export**: Hide export button when no messages exist, show error if somehow triggered
- **Long Conversations**: Handle exports of large message histories without performance issues
- **Account Creation Validation**: Validate username length (min 3 chars), email format, password strength (min 6 chars)
- **Duplicate Accounts**: Prevent creating accounts with duplicate emails
- **Account Not Found**: Show helpful error when attempting to login with non-existent account
- **Guest Mode**: Allow users to use the app without logging in (data stored under "guest" key)
- **User Data Isolation**: Ensure each user's messages and knowledge files are completely separate
- **ZIP File Handling**: ZIP archives are recognized but not extracted - bot references them as archives
- **Code File Processing**: Code files (JS, TS, PY, etc.) are read as text and displayed with syntax awareness
- **Multiple File Attachments**: Support attaching multiple files in messages and knowledge base

## Design Direction
The design should feel modern, intelligent, and inviting - like talking to a knowledgeable friend. It should balance sophistication with approachability, using a tech-forward aesthetic that feels capable and trustworthy. The interface should fade into the background during conversation while providing clear affordances for uploading and managing knowledge.

## Color Selection
A deep purple and cyan tech aesthetic with warm accent touches to humanize the AI interaction.

- **Primary Color**: Deep Purple (oklch(0.45 0.15 300)) - Represents intelligence, creativity, and technology
- **Secondary Colors**: 
  - Dark slate background (oklch(0.15 0.02 260)) - Creates depth and focus
  - Light purple muted areas (oklch(0.25 0.08 290)) - Subtle backgrounds for cards
- **Accent Color**: Bright Cyan (oklch(0.75 0.15 200)) - High-tech, energetic highlight for CTAs and active states
- **Foreground/Background Pairings**:
  - Primary Purple (oklch(0.45 0.15 300)): White text (oklch(0.98 0 0)) - Ratio 7.2:1 ✓
  - Accent Cyan (oklch(0.75 0.15 200)): Dark slate (oklch(0.15 0.02 260)) - Ratio 12.8:1 ✓
  - Background Dark (oklch(0.15 0.02 260)): Light gray text (oklch(0.85 0.01 260)) - Ratio 9.4:1 ✓
  - Muted areas (oklch(0.25 0.08 290)): Light text (oklch(0.90 0.01 260)) - Ratio 8.1:1 ✓

## Font Selection
Typography should feel contemporary and slightly technical while remaining highly readable - a modern sans-serif that conveys both intelligence and approachability.

- **Primary Font**: Space Grotesk - Modern geometric sans with technical precision
- **Typographic Hierarchy**:
  - H1 (App Title "Chatter Box"): Space Grotesk Bold/32px/tight letter spacing (-0.02em)
  - H2 (Section Headers): Space Grotesk SemiBold/18px/normal spacing
  - Body (Chat Messages): Space Grotesk Regular/15px/relaxed line height (1.6)
  - Small (Timestamps, Meta): Space Grotesk Regular/13px/muted color
  - Code/File names: Space Grotesk Medium/14px/monospace feel

## Animations
Animations should feel responsive and intelligent, like the AI is thinking and reacting. Use subtle micro-interactions for feedback with slightly more pronounced animations for key moments (message sending, bot responding).

- **Message animations**: Slide up with fade-in (200ms ease-out) when new messages appear
- **Bot typing indicator**: Pulsing dots animation to show processing (smooth loop)
- **File upload**: Progress bar with smooth fill animation, success checkmark bounce
- **Button interactions**: Quick scale (0.98) on press with cyan glow on hover
- **Knowledge base items**: Fade in on add, slide out on remove (250ms)
- **Scroll behavior**: Smooth auto-scroll to new messages with gentle deceleration
- **Voice recording**: Pulsing animation on microphone button while actively listening (destructive red pulse)
- **Transcript updates**: Smooth text updates in input field as speech is recognized

## Component Selection

- **Components**:
  - `Card` - Contains chat interface and knowledge base panel with subtle shadow and purple-tinted border
  - `Input` - Message input field with cyan focus ring and smooth transitions
  - `Button` - Primary action (send, upload) with cyan background and press animation
  - `ScrollArea` - Chat message container with custom purple scrollbar
  - `Avatar` - User and bot avatars with distinct colors (user: cyan, bot: purple)
  - `Badge` - File type indicators in knowledge base (PDF, TXT, JPG) with color coding
  - `Alert` - Error and success notifications using Sonner toasts with appropriate colors
  - `Progress` - File upload progress bar with cyan fill

- **Customizations**:
  - Custom message bubbles (user: cyan accent, bot: muted purple card)
  - Typing indicator component with three animated dots
  - File upload drop zone with dashed border and hover state
  - Knowledge base list items with file icon, name, and remove button

- **States**:
  - Buttons: Default (cyan), hover (brighter cyan + glow), active (scale down), disabled (muted)
  - Input: Default (subtle border), focus (cyan ring + border), typing (subtle pulse), error (red tint)
  - Messages: Sending (reduced opacity), sent (full opacity), error (shake animation)
  - Upload zone: Default (dashed border), hover (solid border + bg tint), dragging over (cyan glow)

- **Icon Selection**:
  - Send message: `PaperPlaneRight` (Phosphor)
  - Upload files: `UploadSimple` (Phosphor)
  - Bot avatar: `Robot` (Phosphor)
  - User avatar: `User` (Phosphor)
  - Remove file: `X` or `Trash` (Phosphor)
  - File types: `File`, `FileImage`, `FilePdf`, `FileText` (Phosphor)
  - File attachments: `Paperclip` (Phosphor, filled)
  - Voice input (inactive): `Microphone` (Phosphor, filled)
  - Voice input (active): `MicrophoneSlash` (Phosphor, filled, pulsing animation)
  - Text-to-speech (inactive): `SpeakerHigh` (Phosphor, filled, muted color)
  - Text-to-speech (active): `SpeakerSlash` (Phosphor, filled, cyan with pulse animation)
  - Export: `DownloadSimple` (Phosphor, bold)
  - Login: `SignIn` (Phosphor, bold)
  - Logout: `SignOut` (Phosphor, bold)
  - User profile: `User` (Phosphor)

- **Spacing**:
  - Container padding: `p-6` (24px)
  - Message gaps: `gap-4` (16px)
  - Section spacing: `space-y-6` (24px between major sections)
  - Input padding: `px-4 py-3` (comfortable touch target)
  - Card borders: `border-2` with rounded corners `rounded-xl`

- **Mobile**:
  - Single column layout (chat takes full width)
  - Knowledge base moves to collapsible drawer/sheet at bottom
  - Larger touch targets for send/upload buttons (min 48px)
  - Simplified header with compact title
  - Input remains fixed at bottom with send button
  - Messages use full width with tighter padding
  - Upload becomes bottom sheet modal on mobile
