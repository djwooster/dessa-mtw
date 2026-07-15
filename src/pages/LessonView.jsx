import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  Clock,
  Bookmark,
  Maximize2,
  Minimize2,
  Flame,
  Check,
  Eye,
  EyeOff,
  Tag,
  Target,
  Users,
  Lightbulb,
  Brain,
  HelpCircle,
  Share2,
  MessageCircle,
  Globe,
  Printer,
  Headphones,
  SkipBack,
  SkipForward,
  Volume2,
  Download,
  FileText,
  Files,
  ExternalLink,
} from "lucide-react";

const units = [
  {
    id: 1,
    title: "Unit 1 — Meet the Emogers",
    active: false,
    completed: true,
    sub: [
      "Welcome Video!",
      "Emotional Building Blocks",
      "10 Emogers",
      "Power of Pause",
    ],
  },
  {
    id: 2,
    title: "Unit 2 — Naming What We Feel",
    active: false,
    completed: true,
    sub: [
      "Welcome Video!",
      "Feelings Check-In",
      "Emotion Charades",
      "The Feelings Map",
    ],
  },
  {
    id: 3,
    title: "Unit 3 — The Anger Emogre",
    active: false,
    completed: true,
    sub: [
      "Welcome Video!",
      "Meet the Anger Emogre",
      "Body Signals",
      "Cooling Down Strategies",
      "Power of Pause",
    ],
  },
  {
    id: 4,
    title: "Unit 4 — Finding Your Calm",
    active: false,
    completed: true,
    sub: [
      "Welcome Video!",
      "Calm Toolkit",
      "Breathing Buddies",
      "The Pause Button",
    ],
  },
  {
    id: 5,
    title: "Unit 5 — Breathing Together",
    active: true,
    completed: false,
    sub: [
      "Welcome Video!",
      "Breath Awareness",
      "4-7-8 Breathing",
      "Mindful Minute",
      "Partner Share",
    ],
  },
  {
    id: 6,
    title: "Unit 6 — Sharing Our Stories",
    active: false,
    sub: [
      "Welcome Video!",
      "Story Circle",
      "Haikuul 2",
      "The Hero Sandwich",
      "Power of Pause",
    ],
  },
  {
    id: 7,
    title: "Unit 7 — When Things Feel Big",
    active: false,
    sub: [
      "Welcome Video!",
      "The Overwhelm Emogre",
      "Grounding Techniques",
      "Safe Space",
    ],
  },
  {
    id: 8,
    title: "Unit 8 — The Joy Emogre",
    active: false,
    sub: [
      "Welcome Video!",
      "Meet the Joy Emogre",
      "Gratitude Garden",
      "Strength Spotlight",
      "Reflection",
    ],
  },
  {
    id: 9,
    title: "Unit 9 — Connecting with Others",
    active: false,
    sub: [
      "Welcome Video!",
      "The Empathy Engine",
      "Mirror Mirror",
      "Connection Cards",
    ],
  },
  {
    id: 10,
    title: "Unit 10 — Gratitude Practice",
    active: false,
    sub: [
      "Welcome Video!",
      "Gratitude Journal",
      "Appreciation Circle",
      "The Thank-You Game",
    ],
  },
  {
    id: 11,
    title: "Unit 11 — The Worry Emogre",
    active: false,
    sub: [
      "Welcome Video!",
      "Meet the Worry Emogre",
      "The Worry Jar",
      "Thought Bubbles",
      "Power of Pause",
    ],
  },
  {
    id: 12,
    title: "Unit 12 — Mindful Moments",
    active: false,
    sub: [
      "Welcome Video!",
      "Body Scan",
      "Mindful Minute",
      "The Stillness Game",
    ],
  },
  {
    id: 13,
    title: "Unit 13 — Our Feelings Change",
    active: false,
    sub: [
      "Welcome Video!",
      "Feelings Weather Report",
      "Emotion Timeline",
      "Class Circle",
    ],
  },
  {
    id: 14,
    title: "Unit 14 — Asking for Help",
    active: false,
    sub: [
      "Welcome Video!",
      "Who Can Help Me?",
      "The Ask",
      "Welcomly",
      "Reflection",
    ],
  },
  {
    id: 15,
    title: "Unit 15 — Strengthening Empathy",
    active: false,
    sub: [
      "Welcome Video!",
      "Haikuul",
      "The Hero Sandwich",
      "Welcomly",
      "Power of Pause",
    ],
  },
  {
    id: 16,
    title: "Unit 16 — The Sadness Emogre",
    active: false,
    sub: [
      "Welcome Video!",
      "Meet the Sadness Emogre",
      "Holding Space",
      "Comfort Toolkit",
    ],
  },
  {
    id: 17,
    title: "Unit 17 — Making Space for Feelings",
    active: false,
    sub: [
      "Welcome Video!",
      "Emotional Building Blocks",
      "The Feelings Thermometer",
      "Inner Voice",
    ],
  },
  {
    id: 18,
    title: "Unit 18 — Body Signals",
    active: false,
    sub: [
      "Welcome Video!",
      "Body Check-In",
      "Signal Mapping",
      "Partner Share",
      "Power of Pause",
    ],
  },
  {
    id: 19,
    title: "Unit 19 — The Calm Corner",
    active: false,
    sub: [
      "Welcome Video!",
      "Building Your Calm Corner",
      "Tools for Calm",
      "Practice Round",
    ],
  },
  {
    id: 20,
    title: "Unit 20 — Celebrating Growth",
    active: false,
    sub: [
      "Welcome Video!",
      "Growth Gallery",
      "Strength Spotlight",
      "Class Circle",
      "Reflection",
    ],
  },
  {
    id: 21,
    title: "Unit 21 — When We Disagree",
    active: false,
    sub: [
      "Welcome Video!",
      "The Conflict Emogre",
      "Listening First",
      "The Reframe Game",
    ],
  },
  {
    id: 22,
    title: "Unit 22 — The Courage Emogre",
    active: false,
    sub: [
      "Welcome Video!",
      "Meet the Courage Emogre",
      "Small Brave Steps",
      "Courage Circle",
    ],
  },
  {
    id: 23,
    title: "Unit 23 — Trying Again",
    active: false,
    sub: [
      "Welcome Video!",
      "The Setback Emogre",
      "Bounce-Back Toolkit",
      "Try Again Story",
      "Power of Pause",
    ],
  },
  {
    id: 24,
    title: "Unit 24 — Self-Talk Strategies",
    active: false,
    sub: ["Welcome Video!", "Inner Voice", "Flip the Script", "Haikuul 2"],
  },
  {
    id: 25,
    title: "Unit 25 — Setting Intentions",
    active: false,
    sub: [
      "Welcome Video!",
      "What Do I Want?",
      "The Intention Setter",
      "Partner Share",
      "Reflection",
    ],
  },
  {
    id: 26,
    title: "Unit 26 — The Pride Emogre",
    active: false,
    sub: [
      "Welcome Video!",
      "Meet the Pride Emogre",
      "Strength Spotlight",
      "Celebration Ritual",
    ],
  },
  {
    id: 27,
    title: "Unit 27 — Managing Big Reactions",
    active: false,
    sub: [
      "Welcome Video!",
      "Reaction vs. Response",
      "The Pause Button",
      "Cool-Off Toolkit",
      "Power of Pause",
    ],
  },
  {
    id: 28,
    title: "Unit 28 — Our Strengths",
    active: false,
    sub: [
      "Welcome Video!",
      "Strength Mapping",
      "The Hero Sandwich",
      "Strength Circle",
    ],
  },
  {
    id: 29,
    title: "Unit 29 — The Fear Emogre",
    active: false,
    sub: [
      "Welcome Video!",
      "Meet the Fear Emogre",
      "Fear vs. Danger",
      "Brave Breathing",
      "Reflection",
    ],
  },
  {
    id: 30,
    title: "Unit 30 — Safe vs. Unsafe Feelings",
    active: false,
    sub: [
      "Welcome Video!",
      "Feelings Safety Check",
      "Trusted Adults",
      "Class Circle",
    ],
  },
  {
    id: 31,
    title: "Unit 31 — Building Resilience",
    active: false,
    sub: [
      "Welcome Video!",
      "Resilience Roots",
      "Bounce-Back Stories",
      "Welcomly",
      "Power of Pause",
    ],
  },
  {
    id: 32,
    title: "Unit 32 — Checking In With Yourself",
    active: false,
    sub: ["Welcome Video!", "Daily Check-In", "Body Scan", "Mindful Minute"],
  },
  {
    id: 33,
    title: "Unit 33 — The Surprise Emogre",
    active: false,
    sub: [
      "Welcome Video!",
      "Meet the Surprise Emogre",
      "Expect the Unexpected",
      "Adaptability Toolkit",
    ],
  },
  {
    id: 34,
    title: "Unit 34 — Emotional First Aid",
    active: false,
    sub: [
      "Welcome Video!",
      "First Aid for Feelings",
      "Support Toolkit",
      "Partner Share",
      "Reflection",
    ],
  },
  {
    id: 35,
    title: "Unit 35 — Looking Back, Moving Forward",
    active: false,
    sub: [
      "Welcome Video!",
      "Growth Timeline",
      "What I Know Now",
      "Class Circle",
    ],
  },
  {
    id: 36,
    title: "Unit 36 — Celebration of Growth",
    active: false,
    sub: [
      "Welcome Video!",
      "My Growth Story",
      "Strength Spotlight",
      "Gratitude Garden",
      "Celebration Ritual",
    ],
  },
  {
    id: 37,
    title: "Power of Pause Collection",
    active: false,
    sub: [
      "Breathing Exercises",
      "Embodied Relaxation",
      "Recharge",
      "Guided Visualization",
      "Mindful Reflection",
      "Share Outs",
    ],
  },
];

const grade2Units = units.map((u) => ({
  ...u,
  completed: u.id < 31,
  active: u.id === 31,
}));

// Adult Wellness course (course.id 201). Lessons transcribed from the source
// deck — each unit is a mix of "Community" (group facilitation) and
// "Independent" (self-guided) lessons.
const adultWellnessUnits = [
  { id: 1, title: "Getting Started", sub: [
    "Getting Started Guide",
  ]},
  { id: 2, title: "Back to School With a Fresh Start", sub: [
    "Community: Team Effort", "Community: Rhyme Time", "Community: Drawn to Discovery",
    "Independent: Time Capsule", "Independent: Reframing", "Independent: Micro-recoveries", "Independent: I Teach Students",
  ]},
  { id: 3, title: "Self Care for Personal & Professional Wellbeing", sub: [
    "Community: Daydream Believer", "Community: Draw You In", "Community: Shake Off",
    "Independent: Breathe Easier", "Independent: Flight, Fight or Freeze", "Independent: Thought Trains",
    "Independent: Prioritizing Our Time", "Independent: Digging In", "Independent: Moving Through Fear", "Independent: What Works For You?",
  ]},
  { id: 4, title: "Reflect, Reset & Recharge", sub: [
    "Community: Fab Four", "Community: Story of Your Life", "Community: The Do-Over",
    "Independent: Write Away", "Independent: Sensational", "Independent: Attachments",
    "Independent: \"Outlets\"", "Independent: Breathing the Body", "Independent: Other Side of the Door",
  ]},
  { id: 5, title: "Team & Community Building", sub: [
    "Community: Kudos!", "Community: Someone Beside You", "Community: Mirror Mirror",
    "Independent: The Name Game", "Independent: Wonder Words", "Independent: Good Breath", "Independent: Myself With Others",
  ]},
  { id: 6, title: "Leading with Empathy & Personal Sustainability", sub: [
    "Community: Recharge It", "Community: Take a Hike", "Community: Take the Win",
    "Independent: It Takes Two", "Independent: Sustaining Routines", "Independent: Letting the Paint Dry",
    "Independent: Starting vs. Sustaining", "Independent: Signals of Stress",
  ]},
  { id: 7, title: "Coming Together in the Face of Crisis: Moving Through Tragedy", sub: [
    "Community: Taking Care", "Community: Memory Lane", "Community: Connectioning",
    "Independent: Smile a While", "Independent: Finding Hope", "Independent: Sitting in the Love",
    "Independent: In Community", "Independent: Planting a Microchip", "Independent: Eruptions",
    "Independent: Naming It", "Independent: Antidote to Devastation is Creation",
  ]},
].map((u) => ({ ...u, completed: false, active: u.id === 1 }));

// Per-lesson content: PDF overview followed by a video, same pattern as Tier 2
// sessions. A couple of Unit 3 lessons demo the audio media type for dev
// reference: "Breathe Easier" adds audio alongside the video, while
// "Flight, Fight or Freeze" is PDF + audio only (no video).
function adultWellnessLessonContent(unitId, lessonTitle) {
  if (unitId === 1) {
    return [
      { type: "pdf", title: lessonTitle, description: "A printable overview of what to expect from this course and how to get started.", pages: "3 pages" },
    ];
  }
  if (unitId === 3 && lessonTitle === "Independent: Flight, Fight or Freeze") {
    return [
      { type: "audio", title: `${lessonTitle} — Guided Audio`, duration: "5:00", description: "A guided audio practice to use independently." },
      { type: "pdf", title: `${lessonTitle} — Overview`, description: "Facilitator overview and discussion prompts for this practice.", pages: "2 pages" },
    ];
  }
  const isBreatheEasier = unitId === 3 && lessonTitle === "Independent: Breathe Easier";
  const content = [
    { type: "pdf", title: isBreatheEasier ? "Notes" : `${lessonTitle} — Overview`, description: "Facilitator overview and discussion prompts for this practice.", pages: "2 pages", ...(isBreatheEasier ? { image: "/adult-wellness/notes-image.png" } : {}) },
    { type: "video", title: isBreatheEasier ? "Video" : lessonTitle, duration: "3:30", description: "A short video introducing this practice." },
  ];
  if (isBreatheEasier) {
    content.push({ type: "audio", title: "Audio clip", duration: "5:00", description: "A guided audio practice to use independently." });
  }
  return content;
}

// Tier 2 — Early Elementary course (course.id 101). Units transcribed from the
// Tier 2 source. Progress mirrors the existing pattern: early units completed,
// one active.
const tier2EarlyElementaryUnits = [
  { id: 1,  title: "Getting Started",                            sub: ["Tier 2 Training Guide", "Materials"] },
  { id: 2,  title: "Pick-Up Practices",                          sub: ["Opening Exercises", "Quick Emotional Building Block Practice", "Quick Emoger Practice", "Closing Exercises"] },
  { id: 3,  title: "Session 1: Recognizing Emotions",            sub: ["Lesson Materials & Printouts", "Session 1 Content"] },
  { id: 4,  title: "Session 2: Expressing Emotions",             sub: ["Lesson Materials & Printouts", "Session Content 2"] },
  { id: 5,  title: "Session 3: Managing Emotions",               sub: ["Lesson Materials & Printouts", "Session 3 Content"] },
  { id: 6,  title: "Session 4: Impulse Control",                 sub: ["Lesson Materials & Printouts", "Session 4 Content"] },
  { id: 7,  title: "Session 5: Recognizing Our Strengths",       sub: ["Lesson Materials & Printouts", "Session 5 Content"] },
  { id: 8,  title: "Session 6: Social Perspective Taking",       sub: ["Lesson Materials & Printouts", "Session 6 Content"] },
  { id: 9,  title: "Session 7: Active Listening",                sub: ["Lesson Materials & Printouts", "Session 7 Content"] },
  { id: 10, title: "Session 8: Respecting Others",               sub: ["Lesson Materials & Printouts", "Session 8 Content"] },
  { id: 11, title: "Session 9: Building Positive Relationships", sub: ["Lesson Materials & Printouts", "Session 9 Content"] },
  { id: 12, title: "Session 10: Forming a Growth Mindset",       sub: ["Lesson Materials & Printouts", "Session 10 Content"] },
  { id: 13, title: "Session 10: Forming a Growth Mindset",       sub: ["Lesson Materials & Printouts", "Session 10 Content"] },
].map((u) => ({ ...u, completed: u.id <= 8, active: u.id === 9 }));

// Tier 2 session content — 3 videos shown in the established split-panel player,
// plus 3 downloadable PDF resources shown as cards.
const tier2SessionVideos = [
  {
    title: "Opening Exercise",
    duration: "2:40",
    description:
      "Warm up the group and set the tone for recognizing emotions together.",
  },
  {
    title: "Video Exercise — Understanding Our Emotions",
    duration: "5:18",
    description:
      "The core lesson video introducing how we notice and name our emotions.",
  },
  {
    title: "Post-Video Practice",
    duration: "3:05",
    description:
      "Guided practice to reinforce the concepts right after the video.",
  },
];

// Pick-Up Practices — "Quick Emotional Building Block Practice" has one short
// video per emotion (10 total), shown as tabs in the player.
const tier2EmotionVideos = [
  "Angry",
  "Bored",
  "Excited",
  "Frustrated",
  "Nervous",
  "Okay",
  "Relaxed",
  "Sad",
  "Tired",
  "Uncomfortable",
].map((emotion) => ({
  type: "video",
  title: emotion,
  duration: "1:11",
  description: `A quick practice exploring the ${emotion.toLowerCase()} emotion.`,
}));

// "Quick Emoger Practice" — 10 Emoger videos, shown as tabs in the player.
const tier2EmogerVideos = Array.from({ length: 10 }, (_, i) => ({
  type: "video",
  title: `Emoger #${i + 1}`,
  duration: "1:03",
  description: `A quick Emoger practice video (#${i + 1}).`,
}));

const tier2SessionPdfs = [
  {
    title: "Facilitator Guide",
    description:
      "Step-by-step guidance to support effective classroom instruction.",
    pages: "18 pages",
  },
  {
    title: "Understanding Emotions Worksheet",
    description: "A printable student resource for practicing lesson concepts.",
    pages: "1 page",
  },
  {
    title: "Understanding Emotions Worksheet — Continued",
    description: "Continuation worksheet for the second part of the activity.",
    pages: "2 pages",
  },
];

// Getting Started unit — PDF resources.
const tier2TrainingGuidePdf = [
  {
    title: "Tier 2 Training Guide",
    description:
      "Everything you need to get started: a guided overview of the Tier 2 platform and approach.",
    pages: "24 pages",
  },
];

const tier2MaterialsPdfs = [
  {
    title: "Emotional Building Blocks Early Elementary",
    description:
      "A foundational reference covering the core emotional building blocks introduced in Tier 2 early elementary sessions.",
    pages: "1 page",
    image: "/emote-1.jpg",
  },
  {
    title: "10 Emogers Poster (PreK-4th)",
    description:
      "A classroom display poster featuring all 10 Emogers, designed for PreK through 4th grade environments.",
    pages: "2 pages",
    image: "/emote-2.jpg",
  },
  {
    title: "Tier 2 Takeaways Template (EE & LE)",
    description:
      "A customizable template for capturing key session takeaways for early and late elementary students.",
    pages: "1 page",
    image: "/blob.jpg",
    objectFit: "contain",
    bgColor: "#E9F4FC",
  },
  {
    title: "CICO Form (Master Template)",
    description:
      "The Check-In/Check-Out form used to track daily student progress and support consistent Tier 2 routines.",
    pages: "3 pages",
    image: "/checklist.jpg",
    objectFit: "contain",
  },
];

// Metadata per session unit (unit.id 3–13 = Sessions 1–10).
const sessionMeta = {
  3:  { objective: "Learn to identify and name emotions in ourselves and others.", time: "35 min" },
  4:  { objective: "Explore healthy and appropriate ways to express different emotions.", time: "35 min" },
  5:  { objective: "Practice strategies for managing strong emotions in the moment.", time: "38 min" },
  6:  { objective: "Learn about our own impulses, understand the need to control them, and practice different strategies for doing so.", time: "38 min" },
  7:  { objective: "Identify personal strengths and understand how they support our wellbeing.", time: "35 min" },
  8:  { objective: "Practice understanding situations from another person's point of view.", time: "40 min" },
  9:  { objective: "Develop and practice active listening skills to strengthen relationships.", time: "38 min", tip: "If you are not the child's primary teacher, ask their teacher about any impulses the student has shown, like interrupting, not raising their hand, hitting, etc. so that you can use relevant examples during the lesson." },
  10: { objective: "Explore what respect looks and sounds like in everyday interactions.", time: "35 min" },
  11: { objective: "Learn strategies for starting and maintaining positive relationships with peers.", time: "40 min" },
  12: { objective: "Understand the difference between a fixed and growth mindset and practice growth-oriented thinking.", time: "38 min" },
  13: { objective: "Understand the difference between a fixed and growth mindset and practice growth-oriented thinking.", time: "38 min" },
};

const session1Content = [
  { type: "video", title: "Opening Exercise", duration: "2:40", description: "Warm up the group and set the tone for recognizing emotions together." },
  { type: "pdf", title: "Pre-Video Practice", description: "Step-by-step guidance to support effective classroom instruction.", pages: "18 pages", image: "/recognize-emotions.png" },
  { type: "video", title: "Video Exercise — Understanding Our Emotions", duration: "5:18", description: "The core lesson video introducing how we notice and name our emotions." },
  { type: "pdf", title: "Understanding Emotions Worksheet", description: "A printable student resource for practicing lesson concepts.", pages: "1 page" },
  { type: "video", title: "Post-Video Practice", duration: "3:05", description: "Guided practice to reinforce the concepts right after the video." },
  { type: "pdf", title: "Understanding Emotions Worksheet — Continued", description: "Continuation worksheet for the second part of the activity.", pages: "2 pages" },
];

function openPlaceholderPdf(title) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(
    `<!doctype html><title>${title}</title><body style="font-family:system-ui,sans-serif;margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#F0F2F5;color:#1B2B4B"><div style="text-align:center"><div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6B7A8D;margin-bottom:8px">PDF Placeholder</div><h1 style="margin:0;font-size:24px">${title}</h1><p style="color:#6B7A8D">Prototype — document preview not available.</p></div></body>`,
  );
  w.document.close();
}

// Established split-panel multi-video player: video stage on the left, an
// episode list on the right that switches between videos.
function MultiVideoPlayer({
  videos,
  activeVideo,
  setActiveVideo,
  language,
  langOpen,
  setLanguage,
  setLangOpen,
}) {
  return (
    <div
      className="flex rounded-2xl overflow-hidden border border-brand-border"
      style={{ height: "300px" }}
    >
      {/* Player */}
      <div className="flex-1 relative" style={{ background: "#1B2B4B" }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.85) 100%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
            style={{ background: "#2A7F8F" }}
          >
            <Play size={16} fill="white" className="text-white ml-0.5" />
          </button>
          <p className="text-white font-semibold text-sm leading-snug mb-1">
            {videos[activeVideo].title}
          </p>
          <p className="text-white/50 text-xs leading-relaxed">
            {videos[activeVideo].description}
          </p>
        </div>
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <Clock size={11} />
          {videos[activeVideo].duration}
        </div>
        <LanguagePicker
          language={language}
          langOpen={langOpen}
          setLanguage={setLanguage}
          setLangOpen={setLangOpen}
        />
      </div>

      {/* Episode list (tabs) */}
      <div className="w-64 bg-white flex-shrink-0 border-l border-brand-border overflow-y-auto">
        <div className="px-4 py-2.5 border-b border-brand-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">
            In this lesson
          </p>
        </div>
        {videos.map((video, i) => (
          <button
            key={i}
            onClick={() => setActiveVideo(i)}
            className={`w-full text-left px-4 py-3 border-b border-brand-border last:border-0 border-l-2 transition-colors ${
              i === activeVideo
                ? "bg-dessa-tealLight border-l-dessa-teal"
                : "border-l-transparent hover:bg-brand-bg"
            }`}
          >
            <p className="text-xs text-brand-subtext mb-0.5">Episode {i + 1}</p>
            <p
              className={`text-sm font-semibold leading-snug mb-1 ${i === activeVideo ? "text-dessa-teal" : "text-brand-text"}`}
            >
              {video.title}
            </p>
            <div className="flex items-center gap-1 text-xs text-brand-subtext">
              <Clock size={10} />
              {video.duration}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MixedContentPlayer({ items, activeItem, setActiveItem, language, langOpen, setLanguage, setLangOpen }) {
  const item = items[activeItem];
  const isVideo = item.type === "video";
  const isAudio = item.type === "audio";
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState("1×");
  const cycleAudioSpeed = () => {
    const idx = SPEEDS.indexOf(audioSpeed);
    setAudioSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };
  return (
    <>
    <div className="flex rounded-2xl overflow-hidden border border-brand-border" style={{ height: "460px" }}>
      <div className="flex-1 relative" style={{ background: "#1B2B4B" }}>
        {isVideo ? (
          <>
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.85) 100%)" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
              <button className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg" style={{ background: "#2A7F8F" }}>
                <Play size={16} fill="white" className="text-white ml-0.5" />
              </button>
              <p className="text-white font-semibold leading-snug mb-1" style={{ fontSize: "18px" }}>{item.title}</p>
              <p className="text-white/50 leading-relaxed" style={{ fontSize: "14px" }}>{item.description}</p>
            </div>
          </>
        ) : isAudio ? (
          <>
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.85) 100%)" }} />
            <div className="absolute inset-0 flex flex-col px-8 pt-6 pb-4">
              {/* Title — centered in remaining space above controls */}
              <div className="flex-1 flex items-center justify-center text-center px-8">
                <p className="text-white font-semibold leading-snug" style={{ fontSize: "20px" }}>{item.title}</p>
              </div>

              {/* Controls + progress — pinned to bottom */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  {/* Left: transport + title */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="p-1.5 rounded-full transition-colors"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      >
                        <SkipBack size={16} />
                      </button>
                      <button
                        onClick={() => setAudioPlaying((v) => !v)}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:brightness-110 shadow-lg"
                        style={{ background: audioPlaying ? "#2A7F8F" : "rgba(255,255,255,0.15)" }}
                        aria-label={audioPlaying ? "Pause" : "Play"}
                      >
                        {audioPlaying ? (
                          <Pause size={14} fill="white" className="text-white" />
                        ) : (
                          <Play size={14} fill="white" className="text-white ml-0.5" />
                        )}
                      </button>
                      <button
                        className="p-1.5 rounded-full transition-colors"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      >
                        <SkipForward size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Right: volume, speed, download */}
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}>
                      <Volume2 size={15} />
                    </button>
                    <button
                      onClick={cycleAudioSpeed}
                      className="px-2 py-1 rounded text-xs font-semibold tabular-nums min-w-[36px] text-center transition-colors"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {audioSpeed}
                    </button>
                    <button className="p-1.5 rounded transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}>
                      <Download size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress bar + timestamps */}
                <div>
                  <div className="relative h-1 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: "0%", background: "#2A7F8F" }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>0:00</span>
                    <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{item.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={() => openPlaceholderPdf(item.title)}
            className="absolute inset-0 w-full group"
            style={{ cursor: "pointer" }}
          >
            {item.image && <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div
              className="absolute inset-0 transition-colors duration-200"
              style={{ background: "rgba(0,0,0,0.28)" }}
            />
            <div
              className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              style={{ background: "rgba(0,0,0,0.18)" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-md bg-white text-brand-text">
                Open Guide in New Tab <ExternalLink size={14} />
              </span>
            </div>
          </button>
        )}
        {(isVideo || isAudio) && <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ background: "rgba(0,0,0,0.45)" }}>
          {isAudio ? <Headphones size={11} /> : <Clock size={11} />}{item.duration}
        </div>}
        {isVideo && <LanguagePicker language={language} langOpen={langOpen} setLanguage={setLanguage} setLangOpen={setLangOpen} />}
      </div>
      <div className="w-80 bg-white flex-shrink-0 border-l border-brand-border overflow-y-auto">
        <div className="px-4 py-2.5 border-b border-brand-border flex items-center justify-between" style={{ background: "#f7f7f7" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">In this lesson</p>
          <span className="flex items-center gap-1 text-xs text-brand-subtext">
            <Clock size={11} />
            35 min
          </span>
        </div>
        {items.map((it, i) => (
          <button key={i} onClick={() => setActiveItem(i)} className={`w-full text-left px-4 py-4 border-b border-brand-border last:border-0 border-l-2 transition-colors ${i === activeItem ? "bg-dessa-tealLight border-l-dessa-teal" : "border-l-transparent hover:bg-brand-bg"}`}>
            {it.type === "video" ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-1.5">
                  <p className="text-sm font-semibold leading-snug min-w-0" style={{ color: i === activeItem ? "#2A7F8F" : "#525252" }}>{i + 1}. {it.title}</p>
                  <span className="text-xs text-brand-subtext flex-shrink-0">{it.duration}</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 w-fit" style={{ borderRadius: "4px", border: "1px solid #dddddd", background: "#f6f6f6", color: "#696969" }}>
                  <Play size={9} fill="currentColor" /> Video
                </span>
              </>
            ) : it.type === "audio" ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-1.5">
                  <p className="text-sm font-semibold leading-snug min-w-0" style={{ color: i === activeItem ? "#2A7F8F" : "#525252" }}>{i + 1}. {it.title}</p>
                  <span className="text-xs text-brand-subtext flex-shrink-0">{it.duration}</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 w-fit" style={{ borderRadius: "4px", border: "1px solid #dddddd", background: "#f6f6f6", color: "#696969" }}>
                  <Headphones size={9} /> Audio
                </span>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-1.5">
                  <p className="text-sm font-semibold leading-snug min-w-0" style={{ color: i === activeItem ? "#2A7F8F" : "#525252" }}>{i + 1}. {it.title}</p>
                  <span className="text-xs text-brand-subtext flex-shrink-0">{it.pages}</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 w-fit" style={{ borderRadius: "4px", border: "1px solid #dddddd", background: "#f6f6f6", color: "#696969" }}>
                  <FileText size={9} /> PDF
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>

    </>
  );
}


// Full-width center-stage card for the Tier 2 Training Guide (Unit 1, lesson 0).
function Tier2TrainingGuideCard({ pdf, showImage, hideAction }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden w-full">
      {/* Full-width cover image */}
      {/* {showImage && (
        <div className="w-full aspect-video overflow-hidden">
          <img
            src="/student-1.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )} */}

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-brand-text leading-snug mb-1">
          {pdf.title}
        </h3>
        <p className="text-sm text-brand-subtext leading-relaxed mb-5 max-w-[470px]">
          {pdf.description}
        </p>

        {/* Metadata + action */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-brand-subtext">
            <span className="flex items-center gap-1 font-medium text-dessa-teal">
              <FileText size={14} /> PDF
            </span>
            <span className="flex items-center gap-1">
              <Files size={14} /> {pdf.pages}
            </span>
          </div>
          <button
            onClick={() => openPlaceholderPdf(pdf.title)}
            className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-md transition-all hover:brightness-95 text-white"
            style={{ background: "#2A7F8F" }}
          >
            Open Guide in New Tab <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// 2-col image-top cards for the Materials lesson (Unit 1, lesson 1).
function Tier2MaterialsGrid({ pdfs, showImages }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {pdfs.map((pdf) => (
        <div
          key={pdf.title}
          className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden flex flex-col"
          style={{ height: showImages ? "340px" : "164px" }}
        >
          {/* Cover image */}
          {showImages && (
          <div
            className="flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{ height: "176px", background: pdf.bgColor || "transparent" }}
          >
            <img
              src={pdf.image}
              alt=""
              className={`h-full w-full ${pdf.objectFit === "contain" ? "object-contain" : "object-cover"}`}
            />
          </div>
          )}

          {/* Content */}
          <div className="flex flex-col flex-1 px-4 pt-3 pb-4">
            <h3 className="text-base font-bold text-brand-text leading-snug mb-1">
              {pdf.title}
            </h3>
            <p className="text-sm text-brand-subtext leading-relaxed line-clamp-2">
              {pdf.description}
            </p>

            {/* Metadata + action */}
            <div className="mt-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm text-brand-subtext">
                <span className="flex items-center gap-1 font-medium text-dessa-teal">
                  <FileText size={14} /> PDF
                </span>
                <span className="flex items-center gap-1">
                  <Files size={14} /> {pdf.pages}
                </span>
              </div>
              <button
                onClick={() => openPlaceholderPdf(pdf.title)}
                className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-md transition-all hover:brightness-95 text-white"
                style={{ background: "#2A7F8F" }}
              >
                Open in New Tab <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const lesson4Videos = [
  {
    title: "What Is the Power of Pause?",
    duration: "3:12",
    description:
      "An introduction to the pause technique and why it works in the classroom.",
  },
  {
    title: "Recognizing Your Triggers",
    duration: "4:45",
    description:
      "How to spot the moments when pausing is most needed — before reacting.",
  },
  {
    title: "The 3-Second Pause",
    duration: "2:58",
    description:
      "A simple, repeatable technique students can use independently.",
  },
  {
    title: "Practice Round",
    duration: "5:20",
    description:
      "Guided whole-class practice with real-time facilitation cues.",
  },
];

const skills = [
  "Emotional Vocabulary",
  "Self-Reflection",
  "Community Building",
  "Active Listening",
];

const tips = [
  "Introduce yourself and set a warm, welcoming tone before pressing play",
  "Pause after the Emoger reveal to let students react — that energy is data",
  "Write the Emoger names on the board as they appear for future reference",
  "No right or wrong feelings — remind students early and often",
];

const integrationIdeas = [
  {
    subject: "ELA",
    idea: "After the video, have students write one sentence describing an Emogre in their own words.",
  },
  {
    subject: "Morning Meeting",
    idea: 'Use Emoger names as a daily check-in format — "Which Emogre visited you this morning?"',
  },
  {
    subject: "Art",
    idea: "Students sketch their own version of their favorite Emogre to post in the classroom.",
  },
];

const discussionPrompts = [
  {
    context: "At Home",
    question:
      "Tell someone at home about one Emogre you learned about today. Which one felt most familiar to you?",
  },
  {
    context: "Back in Class",
    question: "Which Emogre do you think visits your class the most? Why?",
  },
  {
    context: "Going Deeper",
    question:
      "Do you think every person feels the same Emogres, or are some people\u2019s more different? What makes you think that?",
  },
];

const audioTracks = [
  {
    title: "Welcome to Unit 1",
    duration: "1:24",
    scrubPct: 73,
    scrubTime: "1:01",
  },
  {
    title: "Emoger Soundscape",
    duration: "2:45",
    scrubPct: 0,
    scrubTime: "0:00",
  },
  {
    title: "Guided Pause — 3 Breaths",
    duration: "1:02",
    scrubPct: 0,
    scrubTime: "0:00",
  },
  {
    title: "Guided Mindful Minute",
    duration: "1:00",
    scrubPct: 0,
    scrubTime: "0:00",
  },
  {
    title: "Calm Corner Soundscape",
    duration: "5:00",
    scrubPct: 0,
    scrubTime: "0:00",
  },
];

const mindfulAudioTrack = {
  title: "Guided Mindful Minute",
  duration: "1:00",
  description:
    "Teacher-led guided stillness. Press play when students are settled.",
};

const powerOfPauseThemes = [
  {
    title: "Breathing Exercises",
    videos: [
      {
        title: "Introduction to Breath Awareness",
        duration: "2:15",
        description:
          "Establish a foundation for breath-based regulation before any lesson.",
      },
      {
        title: "Box Breathing Practice",
        duration: "1:45",
        description:
          "A structured 4-count breath pattern students can use independently.",
      },
      {
        title: "4-7-8 Reset",
        duration: "2:00",
        description:
          "A calming exhale-focused technique for moments of high stress.",
      },
    ],
  },
  {
    title: "Embodied Relaxation",
    videos: [
      {
        title: "Progressive Muscle Release",
        duration: "3:30",
        description:
          "Systematically tense and release muscle groups to reduce physical tension.",
      },
      {
        title: "Full Body Scan",
        duration: "4:15",
        description:
          "A slow attention-based scan from feet to head, releasing held stress.",
      },
    ],
  },
  {
    title: "Recharge",
    videos: [
      {
        title: "Energy Reset",
        duration: "1:30",
        description:
          "A quick whole-body shake to discharge excess energy and refocus.",
      },
      {
        title: "Movement Break",
        duration: "2:00",
        description:
          "Guided light movement to re-engage students who have been sitting.",
      },
      {
        title: "Shake It Out",
        duration: "1:15",
        description:
          "Simple shaking movement to release tension stored in the body.",
      },
      {
        title: "Grounding Stretch",
        duration: "2:30",
        description:
          "Standing stretches that reconnect students to the present moment.",
      },
    ],
  },
  {
    title: "Guided Visualization",
    videos: [
      {
        title: "Safe Place Journey",
        duration: "4:10",
        description:
          "Guide students to imagine a personal safe and calm inner space.",
      },
      {
        title: "Calm River Visualization",
        duration: "3:45",
        description:
          "A flowing nature scene used to reduce anxiety and build focus.",
      },
      {
        title: "Peaceful Mountain",
        duration: "4:30",
        description:
          "A grounding visualization rooted in stillness and strength.",
      },
    ],
  },
  {
    title: "Mindful Reflection",
    videos: [
      {
        title: "Feelings Check",
        duration: "2:45",
        description:
          "A short pause to notice and name the current emotional state.",
      },
      {
        title: "Gratitude Moment",
        duration: "3:05",
        description:
          "A brief gratitude practice that shifts attention toward the positive.",
      },
    ],
  },
  {
    title: "Share Outs",
    videos: [
      {
        title: "Circle Share",
        duration: "2:30",
        description:
          "Structured pair or circle sharing to close a lesson with connection.",
      },
    ],
  },
];

// ── Slide deck data — Feelings Check-In (Unit 2, Lesson 1) ───────────────
const feelingsCheckInSlides = [
  {
    type: "title",
    title: "Feelings Check-In",
    subtitle: "Unit 2 — Naming What We Feel",
  },
  {
    type: "questions",
    label: "Continuing the Conversation",
    questions: [
      "What's one feeling you noticed in your body this week? Where did you feel it?",
      "Did anything happen today that changed how you were feeling? What was it?",
    ],
  },
  {
    type: "questions",
    label: "Continuing the Conversation",
    questions: [
      "When you feel something big, who or what helps you feel better?",
      "If your feeling had a color right now, what color would it be — and why?",
    ],
  },
  {
    type: "close",
    title: "Keep Checking In",
    body: "Noticing how we feel is the first step to understanding ourselves and each other.",
  },
];

// ── Slide viewer sub-components ───────────────────────────────────────────
function SlideBlob({ style }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: 260,
        height: 260,
        borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
        background: "rgba(0,0,0,0.09)",
        ...style,
      }}
    />
  );
}

function MtwWordmark() {
  return (
    <div className="flex flex-col items-center leading-none select-none">
      <div className="flex items-baseline gap-[1px] font-extrabold text-lg tracking-tight">
        <span style={{ color: "#E8653A" }}>m</span>
        <span style={{ color: "#F5A623" }}>O</span>
        <span style={{ color: "#5B9E4D" }}>V</span>
        <span style={{ color: "#2A7F8F" }}>e</span>
      </div>
      <p
        className="text-[9px] font-bold uppercase"
        style={{ letterSpacing: "0.18em", color: "#E8653A" }}
      >
        This World
      </p>
    </div>
  );
}

function SlideContent({ slide }) {
  if (slide.type === "title") {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#E8653A" }}
      >
        <SlideBlob
          style={{ top: -80, left: -80, transform: "rotate(-20deg)" }}
        />
        <SlideBlob
          style={{ bottom: -80, right: -80, transform: "rotate(15deg)" }}
        />
        <div className="relative z-10 bg-[#FDF8F0] rounded-3xl px-10 py-8 text-center mx-10 shadow-lg">
          <h2 className="text-[2rem] font-black text-brand-text leading-tight tracking-tight mb-2">
            {slide.title}
          </h2>
          <p className="text-sm font-medium text-brand-subtext">
            {slide.subtitle}
          </p>
        </div>
        <div className="absolute bottom-5 right-6 z-10">
          <MtwWordmark />
        </div>
      </div>
    );
  }

  if (slide.type === "questions") {
    return (
      <div
        className="absolute inset-0 flex overflow-hidden"
        style={{ background: "#FDF8F0" }}
      >
        <div className="flex-1 flex flex-col justify-center gap-4 px-8 py-8">
          {slide.questions.map((q, i) => (
            <div
              key={i}
              className="rounded-2xl px-5 py-4 text-sm font-medium leading-relaxed text-white"
              style={{ background: "#E8653A" }}
            >
              {q}
            </div>
          ))}
        </div>
        <div
          className="w-48 flex flex-col items-center justify-center gap-3 px-5"
          style={{ borderLeft: "1px solid rgba(232,101,58,0.2)" }}
        >
          <div
            className="relative w-28 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ background: "#FDF8F0", border: "3px solid #E8653A" }}
          >
            <SlideBlob
              style={{
                top: -30,
                right: -30,
                width: 80,
                height: 80,
                transform: "rotate(20deg)",
              }}
            />
            <MtwWordmark />
          </div>
          <p
            className="text-xs font-bold text-center leading-snug"
            style={{ color: "#E8653A" }}
          >
            {slide.label}
          </p>
        </div>
      </div>
    );
  }

  if (slide.type === "close") {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#E8653A" }}
      >
        <SlideBlob
          style={{ top: -60, right: -60, transform: "rotate(25deg)" }}
        />
        <SlideBlob
          style={{ bottom: -80, left: -60, transform: "rotate(-15deg)" }}
        />
        <div className="relative z-10 bg-[#FDF8F0] rounded-3xl px-10 py-8 text-center mx-12 shadow-lg">
          <h2 className="text-2xl font-black text-brand-text mb-3 tracking-tight">
            {slide.title}
          </h2>
          <p className="text-body text-brand-subtext leading-relaxed">
            {slide.body}
          </p>
        </div>
        <div className="absolute bottom-5 right-6 z-10">
          <MtwWordmark />
        </div>
      </div>
    );
  }

  return null;
}

// fill=false → standalone with aspect ratio + dots below
// fill=true  → fills parent container, dots overlaid inside
function SlideViewer({ slides, fill = false }) {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(0, c - 1));
      if (e.key === "ArrowRight")
        setCurrent((c) => Math.min(slides.length - 1, c + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const inner = (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${fill ? "h-full" : "rounded-2xl shadow-md"}`}
      style={fill ? undefined : { aspectRatio: "16/9" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0"
        >
          <SlideContent slide={slides[current]} />
        </motion.div>
      </AnimatePresence>

      {current > 0 && (
        <button
          onClick={() => setCurrent((c) => c - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <ChevronLeft size={16} className="text-brand-text" />
        </button>
      )}

      {current < slides.length - 1 && (
        <button
          onClick={() => setCurrent((c) => c + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <ChevronRight size={16} className="text-brand-text" />
        </button>
      )}

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-white/85 flex items-center justify-center shadow-md hover:bg-white transition-colors"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 size={13} className="text-brand-text" />
        ) : (
          <Maximize2 size={13} className="text-brand-text" />
        )}
      </button>

      {/* Dots — overlaid inside when fill mode, so they work at any height */}
      {fill && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.28)" }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === current ? 18 : 6,
                height: 6,
                background: i === current ? "white" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (fill) return inner;

  return (
    <div>
      {inner}
      {/* Standalone: dots + caption below the slide */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === current ? 18 : 6,
              height: 6,
              background: i === current ? "#E8653A" : "#E2E6EA",
            }}
          />
        ))}
      </div>
      <p className="text-sm text-brand-subtext text-center mt-1.5">
        Use arrows or ← → keys to advance — display on your classroom screen
        after the video.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function LanguagePicker({ language, langOpen, setLanguage, setLangOpen }) {
  return (
    <div className="absolute bottom-3 right-3 z-10">
      <button
        onClick={() => setLangOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        <Globe size={11} />
        {language}
      </button>
      {langOpen && (
        <div
          className="absolute bottom-full right-0 mb-1.5 bg-white rounded-lg shadow-lg border border-brand-border overflow-hidden"
          style={{ minWidth: "100px" }}
        >
          {["English", "Spanish"].map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setLangOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                language === lang
                  ? "font-semibold text-brand-text bg-brand-bg"
                  : "text-brand-text hover:bg-brand-bg"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-1.5">
      {children}
    </p>
  );
}

function SectionHeading({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && (
        <Icon size={24} className="text-brand-subtext shrink-0 opacity-70" />
      )}
      <h2 className="text-xl font-semibold text-brand-text">{children}</h2>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-brand-border my-10" />;
}

const SPEEDS = ["1×", "1.25×", "1.5×", "0.75×"];

function AudioLibraryView({ grade }) {
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState("1×");

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const handleSelectTrack = (i) => {
    setSelectedTrack(i);
    setIsPlaying(false);
  };

  const track = audioTracks[selectedTrack];
  const fillColor = "#2A7F8F";

  return (
    <div className="max-w-[62rem] mx-auto px-8 py-7 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <p className="text-xs font-semibold tracking-wide text-brand-subtext mb-6">{grade}</p>
        <div className="flex items-center gap-3 mb-1">
          <Headphones size={22} className="text-brand-subtext opacity-70" />
          <h1 className="text-2xl font-semibold text-brand-text">
            Audio Library
          </h1>
        </div>
        <p className="text-sm text-brand-subtext mb-7">
          {grade} · {audioTracks.length} tracks
        </p>

        {/* Split panel: audio player left, track list right */}
        <div
          className="flex rounded-2xl overflow-hidden border border-brand-border"
          style={{ height: "360px" }}
        >
          {/* Left: audio player */}
          <div className="flex-1 relative" style={{ background: "#1B2B4B" }}>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.85) 100%)",
              }}
            />
            <div className="absolute inset-0 flex flex-col px-8 pt-6 pb-4">

              {/* Image — centered in remaining space above controls */}
              <div className="flex-1 flex items-center justify-center">
                <img src="/podcast.png" alt="" className="max-h-36 object-contain" />
              </div>

              {/* Controls + progress — pinned to bottom */}
              <div className="flex flex-col gap-3">

              {/* Controls row: [skip/play/skip + title] justify-between [volume/download/speed] */}
              <div className="flex items-center justify-between">
                {/* Left: transport + title */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        handleSelectTrack(Math.max(0, selectedTrack - 1))
                      }
                      className="p-1.5 rounded-full transition-colors"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      <SkipBack size={16} />
                    </button>
                    <button
                      onClick={() => setIsPlaying((v) => !v)}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:brightness-110 shadow-lg"
                      style={{
                        background: isPlaying
                          ? "#2A7F8F"
                          : "rgba(255,255,255,0.15)",
                      }}
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <Pause size={14} fill="white" className="text-white" />
                      ) : (
                        <Play
                          size={14}
                          fill="white"
                          className="text-white ml-0.5"
                        />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleSelectTrack(
                          Math.min(audioTracks.length - 1, selectedTrack + 1),
                        )
                      }
                      className="p-1.5 rounded-full transition-colors"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      <SkipForward size={16} />
                    </button>
                  </div>
                  <div>
                    {/* <p
                      className="text-xs tabular-nums leading-none mb-1"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Track {selectedTrack + 1} of {audioTracks.length}
                    </p> */}
                    <p
                      className={`text-base font-semibold leading-snug ${isPlaying ? "text-white" : "text-white/80"}`}
                    >
                      {track.title}
                    </p>
                  </div>
                </div>

                {/* Right: volume, download, speed */}
                <div className="flex items-center gap-1">
                  <button
                    className="p-1.5 rounded transition-colors"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    <Volume2 size={15} />
                  </button>

                  <button
                    onClick={cycleSpeed}
                    className="px-2 py-1 rounded text-xs font-semibold tabular-nums min-w-[36px] text-center transition-colors"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {speed}
                  </button>
                  <button
                    className="p-1.5 rounded transition-colors"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    <Download size={15} />
                  </button>
                </div>
              </div>

              {/* Progress bar + timestamps */}
              <div>
                <div
                  className="relative h-1 rounded-full mb-2"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${track.scrubPct}%`,
                      background: "#2A7F8F",
                    }}
                  />
                  {track.scrubPct > 0 && (
                    <div
                      className="absolute top-1/2 w-3 h-3 rounded-full"
                      style={{
                        left: `${track.scrubPct}%`,
                        transform: "translate(-50%, -50%)",
                        background: "#2A7F8F",
                      }}
                    />
                  )}
                </div>
                <div className="flex justify-between">
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {track.scrubTime}
                  </span>
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {track.duration}
                  </span>
                </div>
              </div>

              </div>{/* end controls+progress wrapper */}
            </div>
          </div>

          {/* Right: track list */}
          <div className="w-64 bg-white flex-shrink-0 border-l border-brand-border overflow-y-auto">
            <div className="px-4 py-2.5 border-b border-brand-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">
                In this library
              </p>
            </div>
            {audioTracks.map((t, i) => (
              <button
                key={i}
                onClick={() => handleSelectTrack(i)}
                className={`w-full text-left px-4 py-3 border-b border-brand-border last:border-0 border-l-2 transition-colors ${
                  i === selectedTrack
                    ? "bg-dessa-tealLight border-l-dessa-teal"
                    : "border-l-transparent hover:bg-brand-bg"
                }`}
              >
                <p className="text-xs text-brand-subtext mb-0.5">
                  Track {i + 1}
                </p>
                <p
                  className={`text-sm font-semibold leading-snug mb-1 ${i === selectedTrack ? "text-dessa-teal" : "text-brand-text"}`}
                >
                  {t.title}
                </p>
                <div className="flex items-center gap-1 text-xs text-brand-subtext">
                  <Headphones size={10} />
                  {t.duration}
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LessonView({ onBookmark }) {
  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course;
  const isGrade2 = course?.grade === "Grade 2";
  const isTier2EE = course?.level === 'Tier 2';
  const isAdultWellness = course?.grade === 'Adult Wellness';
  const activeUnits = isTier2EE
    ? tier2EarlyElementaryUnits
    : isAdultWellness
      ? adultWellnessUnits
      : isGrade2
        ? grade2Units
        : units;

  const [expandedUnit, setExpandedUnit] = useState(
    isTier2EE ? 9 : isAdultWellness ? 1 : isGrade2 ? 31 : 5,
  );
  const [selectedLesson, setSelectedLesson] = useState(
    isTier2EE
      ? { unitId: 9, lessonIndex: 0 }
      : isAdultWellness
        ? { unitId: 1, lessonIndex: 0 }
        : isGrade2
          ? { unitId: 31, lessonIndex: 3 }
          : { unitId: 5, lessonIndex: 2 },
  );
  const [activeVideo, setActiveVideo] = useState(0);
  const [activeContent, setActiveContent] = useState("video");
  const [bookmarked, setBookmarked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [language, setLanguage] = useState("English");
  const [langOpen, setLangOpen] = useState(false);
  const [showNextLesson, setShowNextLesson] = useState(false);
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const [showMaterialImages, setShowMaterialImages] = useState(true);
  const [showTrainingGuideImage, setShowTrainingGuideImage] = useState(true);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [mindfulPlaying, setMindfulPlaying] = useState(false);
  const [mindfulSpeed, setMindfulSpeed] = useState("1×");
  const [activePoPVideo, setActivePoPVideo] = useState(0);
  const activeUnitRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    activeUnitRef.current?.scrollIntoView({
      block: "center",
      behavior: "instant",
    });
  }, []);


  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const update = () => setShowNextLesson(el.scrollTop > 50 || el.scrollHeight <= el.clientHeight);
    update();
    el.addEventListener("scroll", update);
    return () => el.removeEventListener("scroll", update);
  }, [selectedLesson]);

  const grade = course?.grade ?? "Grade 3";
  const competency = course?.competency ?? "Self-Awareness";

  const activeUnit = activeUnits.find((u) => u.id === selectedLesson.unitId);
  const isAudioLibrary = selectedLesson.unitId === "audio";
  const lastContentUnit = [...activeUnits].reverse().find(u => u.sub && u.sub.length > 0 && u.id !== 37);
  const isLastLesson =
    !isAudioLibrary &&
    !!lastContentUnit &&
    selectedLesson.unitId === lastContentUnit.id &&
    selectedLesson.lessonIndex === lastContentUnit.sub.length - 1;
  const isPowerOfPause = selectedLesson.unitId === 37;
  const currentLessonTitle = isPowerOfPause
    ? "Power of Pause Collection"
    : (activeUnit?.sub[selectedLesson.lessonIndex] ?? "Welcome Video!");
  const currentUnitTitle = activeUnit?.title ?? "Unit 1 — Meet the Emogers";

  const isLesson4 =
    selectedLesson.unitId === 1 && selectedLesson.lessonIndex === 3;
  const isFeelingsChekin =
    selectedLesson.unitId === 2 && selectedLesson.lessonIndex === 1;
  const isMindfulMinute =
    selectedLesson.unitId === 5 && selectedLesson.lessonIndex === 3;

  const activePoPTheme = isPowerOfPause
    ? (powerOfPauseThemes[selectedLesson.lessonIndex] ?? powerOfPauseThemes[0])
    : null;
  const activePoPVid = activePoPTheme?.videos[activePoPVideo] ?? null;

  const handleSelectLesson = (unitId, lessonIndex) => {
    setSelectedLesson({ unitId, lessonIndex });
    setActiveVideo(0);
    setActivePoPVideo(0);
    setActiveContent("video");
    setBookmarked(false);
  };

  const handleBookmark = () => {
    if (bookmarked) return;
    setBookmarked(true);
    setShowToast(true);
    onBookmark?.({
      lesson: currentLessonTitle,
      unit: currentUnitTitle,
      grade,
      competency,
      course,
    });
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ── Bookmark toast — commented out ── */}

      {/* ── Left sidebar ── */}
      <aside
        className="flex-shrink-0 bg-white border-r border-brand-border flex flex-col overflow-hidden"
        style={{ width: "20rem" }}
      >
        <div className="px-4 py-4 border-b border-brand-border flex items-center justify-between">
          <button
            onClick={() => navigate("/mtw")}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: "#0f6cbd" }}
          >
            <ChevronLeft size={14} />
            Back
          </button>
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-subtext hover:text-brand-text border border-brand-border rounded-md px-2.5 py-1 hover:bg-brand-bg transition-colors"
          >
            {showInactive ? <Eye size={13} /> : <EyeOff size={13} />}
            {showInactive ? "Hide inactive units" : "Show inactive units"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {activeUnits
            .filter((unit) => showInactive || unit.active)
            .map((unit) => {
              const isExpanded = expandedUnit === unit.id;
              const toggle = () => setExpandedUnit(isExpanded ? null : unit.id);
              const isLeafUnit = unit.sub.length === 0;
              const isLeafSelected =
                isLeafUnit && selectedLesson.unitId === unit.id;

              return (
                <div
                  key={unit.id}
                  ref={unit.active ? activeUnitRef : null}
                  className={`border-l-2 ${
                    isLeafSelected
                      ? "border-mtw-amber"
                      : unit.active
                        ? "border-mtw-amber"
                        : unit.completed
                          ? "border-dessa-teal/40"
                          : "border-transparent"
                  }`}
                >
                  {/* Unit row */}
                  <button
                    onClick={
                      isLeafUnit ? () => handleSelectLesson(unit.id, 0) : toggle
                    }
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-brand-bg ${isLeafSelected ? "bg-mtw-amberLight" : ""}`}
                  >
                    {unit.completed ? (
                      <CheckCircle2
                        size={14}
                        className="flex-shrink-0 mt-0.5 text-dessa-teal"
                      />
                    ) : (
                      <Circle
                        size={14}
                        className={`flex-shrink-0 mt-0.5 ${unit.active || isLeafSelected ? "text-mtw-amber" : "text-brand-border"}`}
                      />
                    )}
                    <span
                      className={`flex-1 text-sm leading-snug ${unit.active || isLeafSelected ? "font-bold text-brand-text" : ""}`}
                      style={
                        unit.active || isLeafSelected
                          ? undefined
                          : { color: "#4b5465" }
                      }
                    >
                      {unit.title}
                    </span>
                    {!isLeafUnit && (
                      <ChevronDown
                        size={13}
                        className={`flex-shrink-0 text-brand-subtext transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
                      />
                    )}
                  </button>

                  {/* Sub-items */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="mr-3 mb-1">
                          {unit.sub.map((item, i) => {
                            const isSelectedLesson =
                              selectedLesson.unitId === unit.id &&
                              selectedLesson.lessonIndex === i;
                            return (
                              <div key={item}>
                                <button
                                  onClick={() => handleSelectLesson(unit.id, i)}
                                  className={`w-full flex items-center justify-between py-2.5 text-left transition-colors ${isSelectedLesson ? "bg-mtw-amberLight rounded-lg" : "hover:bg-brand-bg"}`}
                                  style={{
                                    paddingLeft: "56px",
                                    paddingRight: "8px",
                                  }}
                                >
                                  <span
                                    className={`text-sm ${isSelectedLesson ? "font-semibold text-brand-text" : "text-brand-text"}`}
                                  >
                                    {item}
                                  </span>
                                  {unit.completed ? (
                                    <CheckCircle2
                                      size={18}
                                      className="flex-shrink-0 text-dessa-teal"
                                    />
                                  ) : (
                                    <Circle
                                      size={18}
                                      className={`flex-shrink-0 ${isSelectedLesson ? "text-mtw-amber" : "text-brand-border"}`}
                                    />
                                  )}
                                </button>
                                {i < unit.sub.length - 1 && (
                                  <div className="border-t border-brand-border" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
        </div>

        {/* Audio Library entry — sticky, outside scroll area */}
        {!isTier2EE && !isAdultWellness && (
        <div className="flex-shrink-0 border-t border-brand-border">
          <div
            className={`border-l-2 ${isAudioLibrary ? "border-mtw-amber" : "border-transparent"}`}
          >
            <button
              onClick={() => setSelectedLesson({ unitId: "audio" })}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${isAudioLibrary ? "bg-mtw-amberLight" : "hover:bg-brand-bg"}`}
            >
              <Headphones
                size={14}
                className={`flex-shrink-0 ${isAudioLibrary ? "text-mtw-amber" : "text-brand-subtext"}`}
              />
              <span
                className={`flex-1 text-sm leading-snug ${isAudioLibrary ? "font-bold text-brand-text" : ""}`}
                style={isAudioLibrary ? undefined : { color: "#4b5465" }}
              >
                Audio Library
              </span>
              <span className="text-xs text-brand-subtext tabular-nums">
                {audioTracks.length}
              </span>
            </button>
          </div>
        </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <main ref={mainRef} className="flex-1 overflow-y-auto bg-brand-bg">
        {isTier2EE ? (
          (() => {
            const unit = activeUnits.find(
              (u) => u.id === selectedLesson.unitId,
            );
            const li = selectedLesson.lessonIndex;
            const isSessionUnit = unit && unit.id >= 3 && unit.id <= 13;

            let pdfs = null;
            let videos = null;
            let mixedContent = null;
            if (unit) {
              if (unit.id === 1 && li === 0) pdfs = tier2TrainingGuidePdf;
              else if (unit.id === 1 && li === 1) pdfs = tier2MaterialsPdfs;
              else if (unit.id === 2 && li === 1) mixedContent = tier2EmotionVideos;
              else if (unit.id === 2 && li === 2) mixedContent = tier2EmogerVideos;
              else if (isSessionUnit && li === 0) pdfs = tier2SessionPdfs;
              else if (isSessionUnit && li === 1) mixedContent = session1Content;
              else {
                mixedContent = session1Content;
              }
            }
            if (!pdfs && !videos && !mixedContent) return null;

            const showVideo = !!videos;
            const isPdfOnly = !!pdfs && !videos;
            const isTrainingGuide = unit.id === 1 && li === 0;
            const isMaterials = unit.id === 1 && li === 1;
            const isSessionContent = !!mixedContent;
            const title = unit.sub[li];
            const displayTitle = isSessionContent
              ? (unit.title.split(": ")[1] ?? title)
              : title;

            return (
              <div className="max-w-[62rem] mx-auto px-8 pt-7 pb-32">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="mb-8 flex items-end justify-between gap-6"
                >
                  {/* Left: breadcrumb + title */}
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-brand-subtext mb-6">{grade}</p>
                    {!isTrainingGuide && (
                      <h1 className="text-2xl font-semibold text-brand-text">
                        {displayTitle}
                      </h1>
                    )}
                    {isSessionContent && (
                      <p className="text-brand-subtext mt-1 max-w-[640px]" style={{ fontSize: "15px" }}>
                        A mix of short videos and printable guides. Work through each step in order. The videos introduce the concepts, and the guides are ready to print when you need them.
                      </p>
                    )}
                    {(isPdfOnly || isMaterials) && !isTrainingGuide && (
                      <p className="text-sm text-brand-subtext mt-1">
                        Download printable resources for this lesson.
                      </p>
                    )}
                  </div>

                  {/* Right: competency badge + mark as complete */}
                  <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                    {!isTrainingGuide && (
                      <span
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: "#FEF3DC", color: "#F5A623" }}
                      >
                        {competency}
                      </span>
                    )}
                    <motion.button
                      onClick={() => setShowCompletion((v) => !v)}
                      whileTap={{ scale: 0.96 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border transition-colors bg-white ${
                        showCompletion
                          ? "border-dessa-teal text-dessa-teal"
                          : "border-brand-border text-brand-subtext hover:border-dessa-teal hover:text-dessa-teal"
                      }`}
                      style={showCompletion ? undefined : { minWidth: 160 }}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {showCompletion ? (
                          <motion.span
                            key="checked"
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.3, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 18 }}
                            className="flex items-center justify-center rounded-full shrink-0"
                            style={{ width: 18, height: 18, background: "#2A7F8F" }}
                          >
                            <Check size={12} strokeWidth={3} color="white" />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="unchecked"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            className="shrink-0"
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <AnimatePresence mode="wait" initial={false}>
                        {showCompletion ? (
                          <motion.span key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>
                            Completed
                          </motion.span>
                        ) : (
                          <motion.span key="mark" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>
                            Mark as complete
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Mixed sequential content (Session 1) */}
                {isSessionContent && (
                  <MixedContentPlayer
                    items={mixedContent}
                    activeItem={activeVideo}
                    setActiveItem={setActiveVideo}
                    language={language}
                    langOpen={langOpen}
                    setLanguage={setLanguage}
                    setLangOpen={setLangOpen}
                  />
                )}

                {/* Objective + time — below player, matches Kindergarten Skills/Objective layout */}
                {isSessionContent && sessionMeta[unit?.id] && (
                  <>
                    <div className="mt-8 flex flex-col gap-2">
                      <h3 className="text-base font-bold text-brand-text leading-snug flex items-center gap-2"><Target size={16} className="text-brand-subtext opacity-70" />Objective</h3>
                      <p className="text-brand-subtext leading-relaxed" style={{ fontSize: "15px" }}>
                        {sessionMeta[unit.id].objective}
                      </p>
                    </div>
                    {sessionMeta[unit.id].tip && (
                      <div className="mt-8 flex flex-col gap-2">
                        <h3 className="text-base font-bold text-brand-text leading-snug flex items-center gap-2"><Lightbulb size={16} className="text-brand-subtext opacity-70" />Helpful tip</h3>
                        <p className="text-brand-subtext leading-relaxed" style={{ fontSize: "15px" }}>
                          {sessionMeta[unit.id].tip}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Video player */}
                {showVideo && (
                  <div className="mb-8">
                    <MultiVideoPlayer
                      videos={videos}
                      activeVideo={activeVideo}
                      setActiveVideo={setActiveVideo}
                      language={language}
                      langOpen={langOpen}
                      setLanguage={setLanguage}
                      setLangOpen={setLangOpen}
                    />
                  </div>
                )}

                {/* PDF resources */}
                {pdfs && (
                  <div>
                    {showVideo && (
                      <>
                        <h2 className="text-base font-semibold text-brand-text mb-1">
                          Lesson Materials & Printouts
                        </h2>
                        <p className="text-sm text-brand-subtext mb-4">
                          Download printable resources for this lesson.
                        </p>
                      </>
                    )}
                    {isTrainingGuide ? (
                      <>
                        {/* <div className="flex justify-end mb-3">
                          <button
                            onClick={() => setShowTrainingGuideImage((v) => !v)}
                            className="flex items-center gap-1.5 text-xs font-medium text-brand-subtext hover:text-brand-text border border-brand-border rounded-md px-2.5 py-1 hover:bg-brand-bg transition-colors bg-white"
                          >
                            {showTrainingGuideImage ? <EyeOff size={13} /> : <Eye size={13} />}
                            {showTrainingGuideImage ? "Hide image" : "Show image"}
                          </button>
                        </div> */}
                        <Tier2TrainingGuideCard pdf={pdfs[0]} showImage={showTrainingGuideImage} />
                      </>
                    ) : isMaterials ? (
                      <>
                        <Tier2MaterialsGrid pdfs={pdfs} showImages={false} />
                      </>
                    ) : (
                      <Tier2MaterialsGrid pdfs={pdfs} showImages={false} />
                    )}
                  </div>
                )}
              </div>
            );
          })()
        ) : isAudioLibrary ? (
          <AudioLibraryView grade={grade} />
        ) : isAdultWellness ? (
          <div className="max-w-[62rem] mx-auto px-8 py-7">
            <p className="text-xs font-semibold tracking-wide text-brand-subtext mb-6">{grade}</p>
            <p className="text-xs font-semibold tracking-wide text-brand-subtext mb-2">
              {activeUnit?.title ?? "Getting Started"}
            </p>
            <h1 className="text-2xl font-semibold text-brand-text mb-5">
              {activeUnit?.sub[selectedLesson.lessonIndex] ?? "Getting Started Guide"}
            </h1>
            <MixedContentPlayer
              items={adultWellnessLessonContent(
                activeUnit?.id,
                activeUnit?.sub[selectedLesson.lessonIndex] ?? "Getting Started Guide",
              )}
              activeItem={activeVideo}
              setActiveItem={setActiveVideo}
              language={language}
              langOpen={langOpen}
              setLanguage={setLanguage}
              setLangOpen={setLangOpen}
            />
          </div>
        ) : (
          <div className="max-w-[62rem] mx-auto px-8 py-7">
            {/* Lesson meta */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="mb-5"
            >
              <div className="flex items-end justify-between">
                {/* Left: course title + lesson title */}
                <div>
                  <p className="text-xs font-semibold tracking-wide text-brand-subtext mb-6">{grade}</p>
                  <h1 className="text-2xl font-semibold text-brand-text">
                    {currentLessonTitle}
                  </h1>
                </div>

                {/* Right: badge + action buttons */}
                <div className="flex flex-col items-end gap-2.5 flex-shrink-0 ml-6">
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: "#FEF3DC", color: "#F5A623" }}
                  >
                    {competency}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Bookmark — commented out
                  <button onClick={handleBookmark} aria-label="Bookmark lesson">
                    <Bookmark size={15} />
                  </button>
                  */}
                    {/* Mark as complete */}
                    <motion.button
                      onClick={() => setShowCompletion((v) => !v)}
                      whileTap={{ scale: 0.96 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border transition-colors bg-white ${
                        showCompletion
                          ? "border-dessa-teal text-dessa-teal"
                          : "border-brand-border text-brand-subtext hover:border-dessa-teal hover:text-dessa-teal"
                      }`}
                      style={showCompletion ? undefined : { minWidth: 160 }}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {showCompletion ? (
                          <motion.span
                            key="checked"
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.3, opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 18,
                            }}
                            className="flex items-center justify-center rounded-full shrink-0"
                            style={{
                              width: 18,
                              height: 18,
                              background: "#2A7F8F",
                            }}
                          >
                            <Check size={12} strokeWidth={3} color="white" />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="unchecked"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            className="shrink-0"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 18 18"
                              fill="none"
                            >
                              <circle
                                cx="9"
                                cy="9"
                                r="8"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <AnimatePresence mode="wait" initial={false}>
                        {showCompletion ? (
                          <motion.span
                            key="done"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.14 }}
                          >
                            Completed
                          </motion.span>
                        ) : (
                          <motion.span
                            key="mark"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.14 }}
                          >
                            Mark as complete
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Video ── */}
            <motion.div
              key={`video-${selectedLesson.unitId}-${selectedLesson.lessonIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.05 }}
              className="mb-7"
            >
              {/* Single video */}
              {!isLesson4 &&
                !isFeelingsChekin &&
                !isMindfulMinute &&
                !isPowerOfPause && (
                  <>
                    <div
                      className="w-full rounded-2xl overflow-hidden relative"
                      style={{ aspectRatio: "16/9", background: "#1B2B4B" }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.8) 100%)",
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <button
                          className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
                          style={{ background: "#2A7F8F" }}
                        >
                          <Play
                            size={20}
                            fill="white"
                            className="text-white ml-0.5"
                          />
                        </button>
                        <p className="text-white/70 text-sm">
                          Unit 1 — Welcome Video
                        </p>
                      </div>
                      <div
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                        style={{ background: "rgba(0,0,0,0.45)" }}
                      >
                        <Clock size={11} />
                        6:48
                      </div>
                      <LanguagePicker
                        language={language}
                        langOpen={langOpen}
                        setLanguage={setLanguage}
                        setLangOpen={setLangOpen}
                      />
                    </div>
                  </>
                )}

              {/* Feelings Check-In — video + slide deck with content-type selector */}
              {isFeelingsChekin && (
                <div
                  className="flex rounded-2xl overflow-hidden border border-brand-border"
                  style={{ height: 360 }}
                >
                  {/* Left: active content */}
                  <div className="flex-1 relative overflow-hidden">
                    {activeContent === "video" && (
                      <>
                        <div
                          className="absolute inset-0"
                          style={{ background: "#1B2B4B" }}
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.8) 100%)",
                          }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <button
                            className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
                            style={{ background: "#2A7F8F" }}
                          >
                            <Play
                              size={20}
                              fill="white"
                              className="text-white ml-0.5"
                            />
                          </button>
                          <p className="text-white/70 text-sm">
                            Feelings Check-In — Introduction
                          </p>
                        </div>
                        <div
                          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                          style={{ background: "rgba(0,0,0,0.45)" }}
                        >
                          <Clock size={11} />
                          5:14
                        </div>
                        <LanguagePicker
                          language={language}
                          langOpen={langOpen}
                          setLanguage={setLanguage}
                          setLangOpen={setLangOpen}
                        />
                      </>
                    )}
                    {activeContent === "slides" && (
                      <SlideViewer slides={feelingsCheckInSlides} fill />
                    )}
                  </div>

                  {/* Right: content-type selector */}
                  <div className="w-56 bg-white flex-shrink-0 border-l border-brand-border flex flex-col">
                    <div className="px-4 py-2.5 border-b border-brand-border">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">
                        In This Lesson
                      </p>
                    </div>

                    {/* Video option */}
                    <button
                      onClick={() => setActiveContent("video")}
                      className={`w-full text-left px-4 py-3.5 border-b border-brand-border border-l-2 transition-colors ${
                        activeContent === "video"
                          ? "bg-dessa-tealLight border-l-dessa-teal"
                          : "border-l-transparent hover:bg-brand-bg"
                      }`}
                    >
                      <p className="text-xs text-brand-subtext mb-0.5">Video</p>
                      <p
                        className={`text-sm font-semibold leading-snug mb-1.5 ${activeContent === "video" ? "text-dessa-teal" : "text-brand-text"}`}
                      >
                        Feelings Check-In — Introduction
                      </p>
                      <div className="flex items-center gap-1 text-xs text-brand-subtext">
                        <Clock size={10} />
                        5:14
                      </div>
                    </button>

                    {/* Slide deck option */}
                    <button
                      onClick={() => setActiveContent("slides")}
                      className={`w-full text-left px-4 py-3.5 border-l-2 transition-colors ${
                        activeContent === "slides"
                          ? "bg-dessa-tealLight border-l-dessa-teal"
                          : "border-l-transparent hover:bg-brand-bg"
                      }`}
                    >
                      <p className="text-xs text-brand-subtext mb-0.5">
                        Slide Deck
                      </p>
                      <p
                        className={`text-sm font-semibold leading-snug mb-1.5 ${activeContent === "slides" ? "text-dessa-teal" : "text-brand-text"}`}
                      >
                        Continuing the Conversation
                      </p>
                      <div className="flex items-center gap-1 text-xs text-brand-subtext">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <path d="M8 21h8M12 17v4" />
                        </svg>
                        4 slides
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Mindful Minute — video + guided audio with content-type selector */}
              {isMindfulMinute && (
                <div
                  className="flex rounded-2xl overflow-hidden border border-brand-border"
                  style={{ height: 360 }}
                >
                  {/* Left: active content */}
                  <div className="flex-1 relative overflow-hidden">
                    {activeContent === "video" && (
                      <>
                        <div
                          className="absolute inset-0"
                          style={{ background: "#1B2B4B" }}
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.8) 100%)",
                          }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <button
                            className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
                            style={{ background: "#2A7F8F" }}
                          >
                            <Play
                              size={20}
                              fill="white"
                              className="text-white ml-0.5"
                            />
                          </button>
                          <p className="text-white/70 text-sm">
                            Mindful Minute — Introduction
                          </p>
                        </div>
                        <div
                          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                          style={{ background: "rgba(0,0,0,0.45)" }}
                        >
                          <Clock size={11} />
                          4:22
                        </div>
                        <LanguagePicker
                          language={language}
                          langOpen={langOpen}
                          setLanguage={setLanguage}
                          setLangOpen={setLangOpen}
                        />
                      </>
                    )}
                    {activeContent === "audio" && (
                      <>
                        <div
                          className="absolute inset-0"
                          style={{ background: "#1B2B4B" }}
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.8) 100%)",
                          }}
                        />

                        {/* Image — centered in space above player bar */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pb-16">
                          <img src="/podcast.png" alt="" className="max-h-24 object-contain" />
                        </div>

                        {/* Player bar */}
                        <div
                          className="absolute bottom-0 left-0 right-0 px-4 pt-2.5 pb-3"
                          style={{ background: "rgba(0,0,0,0.38)" }}
                        >
                          <div className="flex items-center gap-3 mb-1.5">
                            <button
                              onClick={() => setMindfulPlaying((v) => !v)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:brightness-110"
                              style={{
                                background: mindfulPlaying
                                  ? "#2A7F8F"
                                  : "rgba(255,255,255,0.15)",
                              }}
                            >
                              {mindfulPlaying ? (
                                <Pause size={13} fill="white" className="text-white" />
                              ) : (
                                <Play size={13} fill="white" className="text-white ml-0.5" />
                              )}
                            </button>

                            <div
                              className="flex-1 relative h-1 rounded-full"
                              style={{ background: "rgba(255,255,255,0.2)" }}
                            >
                              <div
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{ width: "0%", background: "#2A7F8F" }}
                              />
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button className="p-1 rounded transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}>
                                <Volume2 size={13} />
                              </button>
                              <button className="p-1 rounded transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}>
                                <Download size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  const idx = SPEEDS.indexOf(mindfulSpeed);
                                  setMindfulSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
                                }}
                                className="px-1.5 py-0.5 rounded text-xs font-semibold tabular-nums min-w-[32px] text-center transition-colors"
                                style={{ color: "rgba(255,255,255,0.55)" }}
                              >
                                {mindfulSpeed}
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between" style={{ paddingLeft: "44px" }}>
                            <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>0:00</span>
                            <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{mindfulAudioTrack.duration}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right: content-type selector */}
                  <div className="w-56 bg-white flex-shrink-0 border-l border-brand-border flex flex-col">
                    <div className="px-4 py-2.5 border-b border-brand-border">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">
                        In This Lesson
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveContent("video")}
                      className={`w-full text-left px-4 py-3.5 border-b border-brand-border border-l-2 transition-colors ${
                        activeContent === "video"
                          ? "bg-dessa-tealLight border-l-dessa-teal"
                          : "border-l-transparent hover:bg-brand-bg"
                      }`}
                    >
                      <p className="text-xs text-brand-subtext mb-0.5">Video</p>
                      <p
                        className={`text-sm font-semibold leading-snug mb-1.5 ${activeContent === "video" ? "text-dessa-teal" : "text-brand-text"}`}
                      >
                        Mindful Minute — Introduction
                      </p>
                      <div className="flex items-center gap-1 text-xs text-brand-subtext">
                        <Clock size={10} />
                        4:22
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveContent("audio")}
                      className={`w-full text-left px-4 py-3.5 border-l-2 transition-colors ${
                        activeContent === "audio"
                          ? "bg-dessa-tealLight border-l-dessa-teal"
                          : "border-l-transparent hover:bg-brand-bg"
                      }`}
                    >
                      <p className="text-xs text-brand-subtext mb-0.5">
                        Podcast Episode
                      </p>
                      <p
                        className={`text-sm font-semibold leading-snug mb-1.5 ${activeContent === "audio" ? "text-dessa-teal" : "text-brand-text"}`}
                      >
                        {mindfulAudioTrack.title}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-brand-subtext">
                        <Headphones size={10} />
                        {mindfulAudioTrack.duration}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Lesson 4 — split panel: player left, episode list right */}
              {isLesson4 && (
                <div
                  className="flex rounded-2xl overflow-hidden border border-brand-border"
                  style={{ height: "300px" }}
                >
                  {/* Player */}
                  <div
                    className="flex-1 relative"
                    style={{ background: "#1B2B4B" }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.85) 100%)",
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                      <button
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
                        style={{ background: "#2A7F8F" }}
                      >
                        <Play
                          size={16}
                          fill="white"
                          className="text-white ml-0.5"
                        />
                      </button>
                      <p className="text-white font-semibold text-sm leading-snug mb-1">
                        {lesson4Videos[activeVideo].title}
                      </p>
                      <p className="text-white/50 text-xs leading-relaxed">
                        {lesson4Videos[activeVideo].description}
                      </p>
                    </div>
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ background: "rgba(0,0,0,0.45)" }}
                    >
                      <Clock size={11} />
                      {lesson4Videos[activeVideo].duration}
                    </div>
                    <LanguagePicker
                      language={language}
                      langOpen={langOpen}
                      setLanguage={setLanguage}
                      setLangOpen={setLangOpen}
                    />
                  </div>

                  {/* Episode list */}
                  <div className="w-64 bg-white flex-shrink-0 border-l border-brand-border overflow-y-auto">
                    <div className="px-4 py-2.5 border-b border-brand-border">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">
                        In this lesson
                      </p>
                    </div>
                    {lesson4Videos.map((video, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveVideo(i)}
                        className={`w-full text-left px-4 py-3 border-b border-brand-border last:border-0 border-l-2 transition-colors ${
                          i === activeVideo
                            ? "bg-dessa-tealLight border-l-dessa-teal"
                            : "border-l-transparent hover:bg-brand-bg"
                        }`}
                      >
                        <p className="text-xs text-brand-subtext mb-0.5">
                          Episode {i + 1}
                        </p>
                        <p
                          className={`text-sm font-semibold leading-snug mb-1 ${i === activeVideo ? "text-dessa-teal" : "text-brand-text"}`}
                        >
                          {video.title}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-brand-subtext">
                          <Clock size={10} />
                          {video.duration}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Power of Pause Collection — multi-video split panel or full-width single */}
              {isPowerOfPause &&
                activePoPTheme &&
                activePoPTheme.videos.length > 1 && (
                  <div
                    className="flex rounded-2xl overflow-hidden border border-brand-border"
                    style={{ height: "360px" }}
                  >
                    {/* Player */}
                    <div
                      className="flex-1 relative"
                      style={{ background: "#1B2B4B" }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.85) 100%)",
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                        <button
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
                          style={{ background: "#2A7F8F" }}
                        >
                          <Play
                            size={16}
                            fill="white"
                            className="text-white ml-0.5"
                          />
                        </button>
                        <p className="text-white font-semibold text-sm leading-snug mb-1">
                          {activePoPVid.title}
                        </p>
                        <p className="text-white/50 text-xs leading-relaxed max-w-xs">
                          {activePoPVid.description}
                        </p>
                      </div>
                      <div
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                        style={{ background: "rgba(0,0,0,0.45)" }}
                      >
                        <Clock size={11} />
                        {activePoPVid.duration}
                      </div>
                      <LanguagePicker
                        language={language}
                        langOpen={langOpen}
                        setLanguage={setLanguage}
                        setLangOpen={setLangOpen}
                      />
                    </div>

                    {/* Episode list */}
                    <div className="w-64 bg-white flex-shrink-0 border-l border-brand-border overflow-y-auto">
                      <div className="px-4 py-2.5 border-b border-brand-border">
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">
                          In this lesson
                        </p>
                      </div>
                      {activePoPTheme.videos.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => setActivePoPVideo(i)}
                          className={`w-full text-left px-4 py-3 border-b border-brand-border last:border-0 border-l-2 transition-colors ${
                            i === activePoPVideo
                              ? "bg-dessa-tealLight border-l-dessa-teal"
                              : "border-l-transparent hover:bg-brand-bg"
                          }`}
                        >
                          <p className="text-xs text-brand-subtext mb-0.5">
                            Episode {i + 1}
                          </p>
                          <p
                            className={`text-sm font-semibold leading-snug mb-1 ${i === activePoPVideo ? "text-dessa-teal" : "text-brand-text"}`}
                          >
                            {v.title}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-brand-subtext">
                            <Clock size={10} />
                            {v.duration}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Power of Pause — single video (no right panel) */}
              {isPowerOfPause &&
                activePoPTheme &&
                activePoPTheme.videos.length === 1 && (
                  <div
                    className="w-full rounded-2xl overflow-hidden relative"
                    style={{ aspectRatio: "16/9", background: "#1B2B4B" }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.8) 100%)",
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                      <button
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
                        style={{ background: "#2A7F8F" }}
                      >
                        <Play
                          size={20}
                          fill="white"
                          className="text-white ml-0.5"
                        />
                      </button>
                      <p className="text-white font-semibold text-sm mb-1">
                        {activePoPVid.title}
                      </p>
                      <p className="text-white/50 text-xs leading-relaxed max-w-sm">
                        {activePoPVid.description}
                      </p>
                    </div>
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ background: "rgba(0,0,0,0.45)" }}
                    >
                      <Clock size={11} />
                      {activePoPVid.duration}
                    </div>
                    <LanguagePicker
                      language={language}
                      langOpen={langOpen}
                      setLanguage={setLanguage}
                      setLangOpen={setLangOpen}
                    />
                  </div>
                )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.1 }}
            >
              {/* ── Skills & Objective ── */}
              {!isPowerOfPause && (
                <>
                  {isMindfulMinute && activeContent === "audio" && (
                    <div
                      className="flex items-start gap-3 rounded-lg border p-4 mb-7"
                      style={{ background: "rgba(42, 127, 143, 0.08)", borderColor: "rgba(42, 127, 143, 0.25)" }}
                    >
                      <Brain size={18} className="text-dessa-teal shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-base font-bold text-dessa-navy leading-snug">
                          Reflection question
                        </h3>
                        <p className="text-brand-subtext leading-relaxed" style={{ fontSize: "15px" }}>
                          What Emoger would you use when you have big emotions and don't know how to respond?
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-6 mb-7">
                    <div>
                      <SectionLabel>Skills</SectionLabel>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs font-medium px-2.5 py-1 rounded-full border border-brand-border text-brand-text bg-white"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <SectionLabel>Objective</SectionLabel>
                      <p className="text-brand-subtext leading-relaxed mt-2" style={{ fontSize: "15px" }}>
                        Students are introduced to the Emoger characters and
                        begin building a shared emotional vocabulary that will
                        be used throughout the course.
                      </p>
                    </div>
                  </div>
                  <Divider />
                </>
              )}

              {isPowerOfPause && <Divider />}

              {isPowerOfPause ? (
                <div className="pb-10">
                  <h2 className="text-xl font-semibold text-brand-text mb-3">
                    All Power of Pause in this Course
                  </h2>
                  <p className="text-body text-brand-subtext leading-relaxed max-w-2xl">
                    This collection brings together every Power of Pause moment
                    from across the course in one place. Each theme represents a
                    distinct calming technique — select any theme in the sidebar
                    to jump straight to those videos without navigating unit by
                    unit.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-brand-text">
                      Facilitation Guide
                    </h2>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-brand-subtext border border-brand-border bg-white hover:bg-brand-bg transition-colors"
                    >
                      <Printer size={14} />
                      Print
                    </button>
                  </div>

                  {/* ── Main Activity ── */}
                  <div className="mb-7">
                    <SectionHeading>Emoger Introduction Circle</SectionHeading>
                    <div className="pl-4 border-l-4 border-mtw-amber">
                      <p className="text-body text-brand-text leading-relaxed mb-3">
                        After the video, go around the circle and ask each
                        student to name one Emogre they recognized in themselves
                        this week — without explaining why. The class listens
                        without comment. This builds emotional awareness and
                        psychological safety from lesson one.
                      </p>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-brand-subtext">
                        <Clock size={12} />
                        10 minutes
                      </div>
                    </div>
                  </div>

                  <Divider />

                  {/* ── Facilitation Tips ── */}
                  <div className="mb-7">
                    <SectionHeading icon={Lightbulb}>
                      Before You Begin
                    </SectionHeading>
                    <ul className="space-y-2.5">
                      {tips.map((tip) => (
                        <li
                          key={tip}
                          className="flex items-center gap-3 text-body text-brand-text"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: "#2D7D78" }}
                          />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Divider />

                  {/* ── Why We Do This ── */}
                  <div className="mb-7">
                    <SectionHeading icon={HelpCircle}>
                      Why We Do This
                    </SectionHeading>
                    <p className="text-body text-brand-text leading-relaxed">
                      Students can't regulate emotions they can't name. The
                      Emoger framework gives children a shared, non-stigmatizing
                      language for the full range of human feeling. Starting
                      here — before any SEL skill-building — means every future
                      lesson lands on prepared ground.
                    </p>
                  </div>

                  <Divider />

                  {/* ── Ideas for Integration ── */}
                  <div className="mb-7">
                    <SectionHeading icon={Share2}>
                      Ideas for Integration
                    </SectionHeading>
                    <div className="grid grid-cols-3 gap-4">
                      {integrationIdeas.map((item) => (
                        <div
                          key={item.subject}
                          className="bg-white rounded-xl border border-brand-border p-4"
                        >
                          <p
                            className="text-xs font-semibold mb-2"
                            style={{ color: "#F5A623" }}
                          >
                            {item.subject}
                          </p>
                          <p className="text-body text-brand-text leading-relaxed">
                            {item.idea}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Divider />

                  {/* ── Continuing the Conversation ── */}
                  <div className="pb-10">
                    <SectionHeading icon={MessageCircle}>
                      Continuing the Conversation
                    </SectionHeading>
                    <div className="grid grid-cols-3 gap-4">
                      {discussionPrompts.map((p) => (
                        <div
                          key={p.context}
                          className="bg-white rounded-xl border border-brand-border p-4"
                        >
                          <p
                            className="text-xs font-semibold mb-2"
                            style={{ color: "#F5A623" }}
                          >
                            {p.context}
                          </p>
                          <p className="text-body text-brand-text leading-relaxed">
                            {p.question}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
        {/* ── Next / Previous Lesson footer ── */}
        <AnimatePresence>
          {!isAudioLibrary && showNextLesson && (
            <motion.div
              initial={{ y: 64 }}
              animate={{ y: 0 }}
              exit={{ y: 64 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-white border-t border-brand-border px-8 py-4 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.02)]"
              style={{ position: "fixed", bottom: 0, left: "20rem", right: 0, zIndex: 10 }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold text-brand-subtext border border-brand-border bg-white hover:bg-brand-bg transition-colors"
              >
                <ChevronLeft size={16} />
                Previous Lesson
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={isLastLesson ? () => setShowCourseComplete(true) : undefined}
                className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold text-white transition-all hover:brightness-95 shadow-sm"
                style={{ background: "#2A7F8F" }}
              >
                {isLastLesson ? "Finish Course" : "Next Lesson"}
                <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Course completion overlay ── */}
      <AnimatePresence>
        {showCourseComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-8"
          >
            {/* Celebration image */}
            <img
              src="/celebrate.png"
              alt=""
              className="w-full max-w-lg rounded-2xl mb-8 object-contain"
              style={{ maxHeight: "260px" }}
            />

            {/* Heading + subheading */}
            <h1 className="text-3xl font-bold text-brand-text text-center mb-3">
              You finished the course!
            </h1>
            <p className="text-brand-subtext text-center max-w-lg mb-8" style={{ fontSize: "16px" }}>
              Amazing work this year. Your students are building real emotional skills they'll carry with them long after the classroom.
            </p>

            {/* Browse more courses */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/mtw")}
              className="flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white transition-all hover:brightness-95 shadow-sm"
              style={{ background: "#2A7F8F" }}
            >
              Browse more courses
            </motion.button>

            {/* Return to dashboard */}
            <button
              onClick={() => navigate("/")}
              className="text-sm font-semibold transition-colors hover:brightness-90"
              style={{ color: "#2A7F8F", marginTop: "24px" }}
            >
              Return to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Completion overlay ── */}
      {false && (
        <AnimatePresence>
          {showCompletion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-white flex flex-col"
            >
              {/* Centered content */}
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                {/* Flame icon */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.1,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  <Flame size={96} style={{ color: "#F5A623" }} />
                </motion.div>

                {/* Streak count */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.25 }}
                  className="text-center mt-4 mb-2"
                >
                  <p
                    className="text-8xl font-bold leading-none"
                    style={{ color: "#F5A623" }}
                  >
                    13
                  </p>
                  <p
                    className="text-xl font-semibold mt-3"
                    style={{ color: "#F5A623" }}
                  >
                    day streak
                  </p>
                </motion.div>

                {/* Week card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.35 }}
                  className="mt-8 border border-brand-border rounded-2xl px-10 py-5 w-full max-w-sm"
                >
                  {/* Day labels */}
                  <div className="flex justify-between mb-2">
                    {[
                      ["M", true],
                      ["Tu", true],
                      ["W", true],
                      ["Th", false],
                      ["F", false],
                    ].map(([label, done]) => (
                      <span
                        key={label}
                        className="text-xs font-semibold w-10 text-center"
                        style={{ color: done ? "#F5A623" : "#6B7A8D" }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  {/* Circles */}
                  <div className="flex justify-between mb-5">
                    {[true, true, true, false, false].map((done, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={
                          done
                            ? { background: "#F5A623" }
                            : { background: "rgba(107,122,141,0.15)" }
                        }
                      >
                        {done && (
                          <Check size={16} strokeWidth={2.5} color="white" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-brand-subtext text-center leading-relaxed">
                    Keep showing up tomorrow to grow your streak.
                  </p>
                </motion.div>
              </div>

              {/* Bottom bar */}
              <div className="border-t border-brand-border px-8 py-5 flex items-center justify-between">
                <button
                  onClick={() => setShowCompletion(false)}
                  className="px-6 py-3 rounded-xl border border-brand-border text-sm font-semibold text-brand-subtext hover:bg-brand-bg transition-colors"
                >
                  Review Lesson
                </button>
                <button
                  onClick={() => navigate("/mtw")}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-95"
                  style={{ background: "#2A7F8F" }}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
