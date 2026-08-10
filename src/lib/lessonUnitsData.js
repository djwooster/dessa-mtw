// Shared unit/lesson lists for Tier 2, Adult Wellness, and Family courses —
// used by LessonView.jsx to render each course, and by resourcesData.js to
// build the Resources search index. Pulled out to its own file (rather than
// living inline in LessonView.jsx) so both can import the same source of
// truth without a lib file depending on a page component.

// Family — parent/guardian-facing series. All 4 grade bands (course.level
// 'Family') share the same 9-unit structure, transcribed from the real MTW
// Early Elementary curriculum — Middle School/High School render the
// competency videos via Stornaway (same video card, just a shared "common
// language" title instead of separate English/Spanish titles).
const familySeriesUnits = [
    {
      id: 1,
      title: "Welcome to Move This World!",
      active: true,
      completed: false,
      sub: ["Overview of MTW Competencies"],
    },
    {
      id: 2,
      title: "The Emotional Building Blocks® & 10 Emogers®",
      active: false,
      completed: false,
      sub: [
        "Emotional Building Blocks Poster_PreK-2nd (English & Spanish)",
        "10 Emogers Elementary School",
        "10 Emogers Elementary School",
      ],
    },
    {
      id: 3,
      title: "Power of Pause",
      active: false,
      completed: false,
      sub: ["Breathing Exercises", "Embodied Relaxation", "Recharge", "Guided Visualization", "Mindful Reflection"],
    },
    {
      id: 4,
      title: "Self-Awareness Videos",
      active: false,
      completed: false,
      sub: ["Emotional Building Blocks", "Emotion Motion", "Emogometer", "Saving Faces", "Sweet Potato"],
    },
    {
      id: 5,
      title: "Self-Management Videos",
      active: false,
      completed: false,
      sub: [
        "10 Emogers",
        "Emoger #1: Tighten and Release",
        "Emoger #2: Count to 10",
        "Emoger #3: Breathe 5 Times",
        "Emoger #4: Walk Away Quietly",
        "Emoger #5: Smile, Give a Hug or a Fist Bump",
        "Emoger #6: Drink a Glass of Water",
        "The Oooh Aaah Song",
      ],
    },
    {
      id: 6,
      title: "Social Awareness Videos",
      active: false,
      completed: false,
      sub: ["Parts of Me", "The Culture Club", "Circle of Trust", "The Feel Wheel"],
    },
    {
      id: 7,
      title: "Relationship Skills Videos",
      active: false,
      completed: false,
      sub: [
        "Emoger #7: Look for Help",
        "Emoger #8: Active Listening",
        "Emoger #9: Meet In The Middle",
        "Emoger #10: Put Yourself in Someone Else's Shoes",
        "Picture Perfect",
        "The Help Line 1-2",
      ],
    },
    {
      id: 8,
      title: "Responsible Decision Making Videos",
      active: false,
      completed: false,
      sub: ["Mistake Erase", "Wooly Bully", "Putting Down Roots", "Live and Learn"],
    },
    {
      id: 9,
      title: "Emotion Motion Podcast",
      active: false,
      completed: false,
      sub: ["Emotion Motion Podcast®"],
    },
];

export const familyUnitsByGrade = {
  "Early Elementary": familySeriesUnits,
  "Late Elementary": familySeriesUnits,
  "Middle School": familySeriesUnits,
  "High School": familySeriesUnits,
};

// Adult Wellness course (course.id 201). Lessons transcribed from the source
// deck — each unit is a mix of "Community" (group facilitation) and
// "Independent" (self-guided) lessons.
export const adultWellnessUnits = [
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

// Tier 2 — Early Elementary course (course.id 101). Units transcribed from the
// Tier 2 source. Progress mirrors the existing pattern: early units completed,
// one active.
export const tier2EarlyElementaryUnits = [
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
