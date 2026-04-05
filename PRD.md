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
- Functionality: Create and login to user accounts where each user's data is stored separately, with customizable names and personality settings
- Purpose: Enables multiple users to have personalized experiences with their own conversations, knowledge bases, and chatbot behavior
- Trigger: Click login button in header
- Progression: Click login → Choose signup or login → Enter credentials → Authenticate → Account created/logged in → User-specific data loads → Customize chatbot name, preferred name, and personality in settings
- Success criteria: Users can create accounts, login/logout, their messages and knowledge files are isolated per user, and chatbot responds according to selected personality style

**Personality Presets**
- Functionality: Select from 12 pre-defined personality styles that change how the chatbot communicates (Friendly Assistant, Professional Expert, Creative Muse, Tech Guru, Patient Teacher, Witty Companion, Straight to the Point, Empathetic Listener, Curious Explorer, Motivational Coach, Academic Scholar, Casual Friend)
- Purpose: Allows users to customize the chatbot's tone, style, and communication approach to match their needs and preferences
- Trigger: Click settings → Navigate to Personality tab
- Progression: Open settings → Personality tab → Browse preset cards with descriptions and traits → Click desired personality → Preview system prompt → Save changes → Bot immediately adopts new communication style in responses
- Success criteria: Personality selection persists per user, bot responses clearly reflect selected style, smooth transition between personalities, visual feedback shows active selection

**AI Model Selection**
- Functionality: Choose from multiple AI models (GPT-4o Mini, GPT-4o) with different speed, quality, and performance characteristics
- Purpose: Allows users to select the AI model that best fits their needs - fast responses for quick questions or higher quality for complex reasoning
- Trigger: Click settings → Navigate to Profile tab → Select AI Model dropdown
- Progression: Open settings → Profile tab → Click AI model dropdown → View available models with descriptions → See speed and quality badges → Select preferred model → Save changes → Bot immediately uses selected model for all future responses
- Success criteria: Model selection persists per user, responses use the selected model, visual indicators show model characteristics (speed/quality), smooth model switching without errors

**Code Syntax Highlighting**
- Functionality: Automatically detects and highlights code blocks in chat messages with language-specific syntax coloring
- Purpose: Makes code snippets easy to read and understand, providing a professional developer-friendly experience
- Trigger: Bot responds with code blocks using markdown syntax (```language code```)
- Progression: Message contains code → Parser detects code blocks → Prism applies syntax highlighting → Code displays with color-coded tokens → Copy button appears on hover
- Success criteria: Code is properly highlighted with accurate language detection, supports 20+ languages (JS, TS, Python, Java, C++, etc.), includes copy-to-clipboard functionality

**Conversation Threads**
- Functionality: Create, switch between, rename, delete, and archive separate chat sessions (threads) to organize different topics
- Purpose: Enables users to maintain multiple organized conversations for different contexts or subjects, with the ability to hide old conversations without deleting them
- Trigger: Click "Conversations" button to manage threads, create new threads with custom names, archive icon to archive/unarchive threads
- Progression: Click conversations → View thread list sorted by recent activity → Toggle between Active and Archived tabs → Click thread to switch → New thread button creates fresh conversation → Rename or delete threads with hover actions → Archive button hides threads from active list → Archived tab shows all archived threads that can be restored
- Success criteria: Each thread maintains its own message history, threads persist per user, can switch seamlessly between threads, thread metadata (message count, last updated) displays accurately, cannot delete the last remaining active thread, archived threads hidden from main view but accessible via archived tab, can restore archived threads to active, archiving current thread auto-switches to another active thread

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
- **Personality Preset Loading**: Default to "Friendly Assistant" if no personality is selected or invalid ID stored
- **Personality Switching**: Apply new personality immediately to next bot response after save, no regeneration of previous messages
- **Personality Persistence**: Save personality selection per user account, maintain across sessions
- **AI Model Selection**: Default to GPT-4o if no model is selected or invalid model ID stored
- **AI Model Switching**: Apply new model immediately to next bot response after save, maintain model selection across sessions
- **AI Model Persistence**: Save model selection per user account, each user can have different preferred model
- **ZIP File Handling**: ZIP archives are recognized but not extracted - bot references them as archives
- **Code File Processing**: Code files (JS, TS, PY, etc.) are read as text and displayed with syntax awareness
- **Multiple File Attachments**: Support attaching multiple files in messages and knowledge base
- **Code Block Rendering**: Handle markdown code blocks (```language) with proper syntax highlighting even in long messages
- **Unsupported Languages**: Display code with basic formatting if language is not recognized by syntax highlighter
- **Copy Code Failures**: Show error toast if clipboard access is denied or unavailable
- **Thread Management**: Prevent deleting the last remaining active thread (archived threads can be deleted), show confirmation dialog before deletion
- **Thread Switching**: Smoothly transition between threads, loading correct message history for each
- **Empty Threads**: Show welcoming empty state when switching to a new thread with no messages
- **Thread Metadata Accuracy**: Keep message counts and last updated timestamps accurate as messages are added
- **Long Thread Lists**: Scroll thread list smoothly when many threads exist, sort by most recent activity
- **Thread Archiving**: Archived threads hidden from active view but fully accessible via archived tab, archiving current thread switches to first available active thread, badge counters show active vs archived counts separately
- **Image Editor Not Opening**: Clicking Images button should always open editor dialog, check for JavaScript errors
- **Canvas Rendering Issues**: Images may not display if browser doesn't support HTML5 Canvas API, show fallback message
- **Image Upload Failures**: Handle unsupported image formats gracefully, show clear error message for format restrictions
- **Filter Performance**: Large images (>2MB) may cause slow filter updates, consider downscaling for preview
- **AI Generation Placeholder**: Full AI image generation not yet available, demo creates abstract shapes, inform users this is coming soon
- **Enhancement Accuracy**: AI enhancement uses simulated adjustments, not true AI vision, set appropriate expectations
- **Multiple Tabs Open**: Only one image can be edited at a time, switching tabs preserves current work
- **Download Compatibility**: Canvas toBlob may not work in older browsers, provide alternative download method
- **Story Generation Timeout**: Very long stories (10+ chapters) may take 30+ seconds to generate, show progress indicator and keep user informed
- **Empty Story Fields**: Require at least title and description, show validation errors for missing required fields
- **Story JSON Parsing**: Handle malformed JSON responses from AI gracefully, retry or show helpful error
- **Chapter Regeneration**: Maintain story context when regenerating individual chapters, ensure consistency with previous chapters
- **Long Story Content**: Stories with many chapters may be difficult to scroll through, consider pagination or chapter navigation
- **Story Download Naming**: Sanitize story titles for valid filenames, handle special characters and length limits
- **Web Search Timeout**: Web search may take 2-3 seconds, show loading indicator during search, gracefully fail if search takes too long or errors
- **No Web Search Results**: Handle empty search results gracefully with helpful message, bot continues with knowledge base only
- **Invalid Search Query**: Very short or nonsensical queries may produce irrelevant results, bot does best interpretation
- **Search Results Parsing**: Handle malformed JSON responses from AI search generation, retry or fall back to knowledge base
- **Web Search Toggle State**: Toggle state persists per user account, guest users have separate toggle state
- **Text-to-Image Empty Prompt**: Require prompt input before generation, show validation error if field is empty
- **Text-to-Image Generation Timeout**: Generation may take 3-5 seconds for complex prompts, show progress indicator with animated icon
- **Text-to-Image AI Errors**: Handle LLM failures gracefully with helpful retry message, fall back to simpler generation if full AI unavailable
- **Large Image Generation**: High quality images may be slower to generate and larger file size, warn users before ultra quality download
- **Generation History Overflow**: Limit to last 10 generations to prevent performance issues, oldest entries automatically removed
- **Image Send to Chat**: Ensure generated images attach correctly to messages and display in chat interface

## Image Operations

**Image Editing**
- Functionality: Adjust images with real-time filters including brightness, contrast, saturation, blur, and rotation
- Purpose: Enables users to perfect images before sharing, with professional-grade editing controls in a simple interface
- Trigger: Click "Images" button in header, select "Edit" tab, and upload or load an image
- Progression: Click Images button → Edit tab → Upload/load image → Adjust sliders (brightness, contrast, saturation, blur, rotation) → Preview updates in real-time → Download or save to chat
- Success criteria: Filters apply smoothly in real-time, changes are reversible with reset button, edited images can be downloaded or saved back to chat

**Image Generation**
- Functionality: Create new images from text descriptions using AI-powered generation (demo mode with abstract visualizations)
- Purpose: Allows users to generate visual content from imagination without needing design skills or external tools
- Trigger: Click "Images" button, navigate to "Generate" tab
- Progression: Click Images button → Generate tab → Enter description in textarea → Click "Generate Image" → AI creates abstract visualization → Preview on canvas → Download or save to chat
- Success criteria: Text descriptions produce relevant abstract visualizations, generation completes within 3 seconds, results are downloadable

**Image Enhancement**
- Functionality: AI-powered automatic image improvements based on natural language instructions
- Purpose: Provides intelligent one-click enhancements without manual adjustment, ideal for quick fixes
- Trigger: Click "Images" button with existing image loaded, navigate to "Enhance" tab
- Progression: Load image → Enhance tab → Describe desired enhancement (e.g., "make brighter and more vibrant") → Click "Enhance with AI" → AI adjusts filters automatically → Preview updated image → Download or save
- Success criteria: Enhancement instructions produce appropriate filter adjustments, enhancements improve image quality, original can be restored with reset

**Story Creation**
- Functionality: Generate detailed multi-chapter stories with AI based on customizable parameters (genre, tone, length, characters, setting)
- Purpose: Enables users to create complete fictional narratives without writing experience, perfect for creative exploration or content generation
- Trigger: Click "Stories" button in header
- Progression: Click Stories → Enter title and description → Select genre, tone, chapter count, and length → Add optional details (characters, setting, conflict) → Click "Generate Story" → AI creates full story with chapters → View, download, or send to chat → Regenerate individual chapters if desired
- Success criteria: Stories are coherent and match specified parameters, chapters flow naturally, regeneration produces different but consistent content, download works in plain text format, stories can be previewed in chat

**Text-to-Image Generation**
- Functionality: Generate artistic images from text descriptions with customizable style, aspect ratio, and quality settings
- Purpose: Enables users to create unique visual content from imagination, perfect for creative projects, social media, or concept visualization
- Trigger: Click user profile dropdown → Settings → Navigate to "AI Art" tab
- Progression: Open AI Art tab → Enter detailed prompt in textarea → Optionally add negative prompt (what to avoid) → Select style (Realistic, Anime, Digital Art, Oil Painting, etc.) → Choose aspect ratio (1:1, 16:9, 9:16, etc.) → Adjust quality slider (Low to Ultra) → Click "Generate Image" → AI creates visual representation → Preview generated image → Download image or send directly to chat → View generation history with previous prompts
- Success criteria: Images generate within 5 seconds, match selected style and aspect ratio, quality adjustment affects detail level, generated images can be downloaded as PNG files or attached to chat messages, generation history shows last 10 creations with clickable thumbnails to reload previous prompts

**Web Search**
- Functionality: Enable AI-powered web search to supplement bot responses with current internet information when answering questions
- Purpose: Provides access to up-to-date information beyond the knowledge base, allowing the bot to answer questions about current events, news, or topics not covered in uploaded documents
- Trigger: Toggle "Web Search" switch above the message input field
- Progression: Enable switch → Ask question → Bot performs web search → Search results card displays with sources → Bot incorporates search results into response → Results remain visible → Close results card with X button
- Success criteria: Search executes within 2-3 seconds, returns 5 relevant results with titles/snippets/URLs, bot cites sources in response, results display with favicon and clickable links, toggle state persists per user account

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
  - `CodeBlock` - Custom component with Prism.js for syntax highlighting with language detection and copy button
  - `Sheet` - Slide-out panel for conversation threads management
  - `AlertDialog` - Confirmation dialog for deleting threads
  - `Dialog` - Full-screen modal for image editor with tabs
  - `Tabs` - Switch between Edit, Generate, and Enhance modes in image editor
  - `Slider` - Precise filter adjustments with real-time visual feedback and value badges
  - `Canvas` - HTML5 Canvas for image rendering and manipulation with filter effects

- **Customizations**:
  - Custom message bubbles (user: cyan accent, bot: muted purple card)
  - Typing indicator component with three animated dots
  - File upload drop zone with dashed border and hover state
  - Knowledge base list items with file icon, name, and remove button
  - Code block header with language label and copy button (appears on hover)
  - Syntax-highlighted code display with custom purple-cyan color scheme matching app theme
  - Thread list items showing title, message count, and last activity time
  - Thread item hover actions for rename, archive, and delete (visible on hover)
  - Thread creation input with instant create button
  - Tabbed interface for Active and Archived threads with count badges
  - Archive button appears on all threads with distinct visual state for archived items
  - Image editor dialog with three-tab interface (Edit, Generate, Enhance)
  - Canvas preview with muted background for image visibility
  - Filter control panel with labeled sliders and real-time value badges
  - Image generation textarea for detailed prompt input
  - Abstract shape generator for demo image creation
  - Download and save buttons with distinct visual styles
  - Web search results card with gradient border and accent highlighting
  - Clickable result items with hover effects and favicon display
  - Web search toggle with switch component and status badge

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
  - Copy code: `Copy` (Phosphor, bold)
  - Code copied: `Check` (Phosphor, bold, accent color)
  - Conversations: `Chat` (Phosphor, bold)
  - New thread: `Plus` (Phosphor, bold)
  - Edit thread: `PencilSimple` (Phosphor, bold)
  - Delete thread: `Trash` (Phosphor, bold)
  - Archive/Unarchive thread: `Archive` (Phosphor, bold)
  - Images: `Image` (Phosphor, filled)
  - Image edit: `PaintBrush` (Phosphor, filled)
  - Image create: `Sparkle` (Phosphor, filled)
  - Image enhance: `MagicWand` (Phosphor, filled)
  - Brightness: `SunDim` (Phosphor)
  - Reset filters: `ArrowCounterClockwise` (Phosphor)
  - Save image: `FloppyDisk` (Phosphor, filled)
  - Stories: `BookOpen` (Phosphor, filled)
  - Story chapter: `Book` (Phosphor)
  - Regenerate: `ArrowCounterClockwise` (Phosphor)
  - Web search: `Globe` (Phosphor, filled)
  - Search in progress: `MagnifyingGlass` (Phosphor, animated pulse)

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
