import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, Video, FileText, Mic, ClipboardList, MousePointerClick,
  BookOpen, Users, GraduationCap, Layers, ChevronDown, Presentation, PlayCircle,
  Check, LayoutList, LayoutGrid, ExternalLink, ArrowRight, X,
} from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { useResourcesConcept } from '../lib/resourcesConceptContext'

// ─── Resources — alternate concepts B/C/D/E ────────────────────────────────
// Rendered by Resources.jsx whenever the nav's A/B/C/D/E switcher (see
// resourcesConceptContext.jsx + Nav.jsx) is on anything other than 'a' — 'a'
// is the live, already-shipped experience defined directly in Resources.jsx.
// These three used to live at their own /resources-concepts sandbox route
// (Concepts A/D/E there); folded in here, relettered B/C/D respectively, so
// every concept is reachable from one switcher instead of split across a
// settings-menu link and an always-on nav hover. Content is still mocked —
// this is page-structure/mechanism exploration, not a data migration.

const ELEMENTARY_GROUP = ['Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade']
const MIDDLE_GROUP = ['6th Grade', '7th Grade', '8th Grade']
const HIGH_GROUP = ['9th Grade', '10th Grade', '11th Grade', '12th Grade']
const SELECTABLE_GRADES = [...ELEMENTARY_GROUP, ...MIDDLE_GROUP, ...HIGH_GROUP, 'All Grades']
const COURSE_TYPES = ['Tier 1', 'Tier 2', 'Family']
const COMPETENCIES = ['Self-Awareness', 'Self-Management', 'Relationship Skills', 'Social Awareness', 'Responsible Decision-Making']

// Six types, covering every base the Monday review needs to demonstrate:
// standalone assets (Video/PDF/Worksheet/Audio), links to recorded sessions
// (Webinar), and resources that open a full lesson inside a course (Lesson)
// rather than a standalone clip.
const TYPE_META = {
  Video: { icon: Video, label: 'Video', color: 'text-dessa-magenta', bg: 'bg-dessa-magenta' },
  PDF: { icon: FileText, label: 'PDF', color: 'text-mtw-purple', bg: 'bg-mtw-purple' },
  Worksheet: { icon: ClipboardList, label: 'Worksheet', color: 'text-mtw-coral', bg: 'bg-mtw-coral' },
  Audio: { icon: Mic, label: 'Audio', color: 'text-mtw-blue', bg: 'bg-mtw-blue' },
  Webinar: { icon: Presentation, label: 'Webinar', color: 'text-mtw-green', bg: 'bg-mtw-green' },
  Lesson: { icon: PlayCircle, label: 'Lesson', color: 'text-mtw-amber', bg: 'bg-mtw-amber' },
}

// Expanded 2026-09-12 (8→22) and again 2026-09-15 (22→78, ~4 items per
// individual grade, template-generated with grade-appropriate naming per
// competency rather than hand-authored per item — explicitly fine per the
// user, since the goal is realistic-looking coverage for user testing, not
// bespoke copy) so every type/competency/course-type/grade has real
// coverage — filtering needs to actually produce varied, non-trivial result
// sets across B/C/D/E, not just prove the UI wires up. Still all mock data,
// not the real resourcesData catalog.
const MOCK_RESOURCES = [
  { title: 'Emotion Check-In Video', type: 'Video', grade: 'Kindergarten', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit 1: Naming Emotions', desc: 'A short video prompting students to name how they feel before the school day starts.' },
  { title: 'Calm Down Corner Guide', type: 'PDF', grade: '1st Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 2: Self-Management Basics', desc: 'Printable steps for setting up a calm-down space in an early elementary classroom.' },
  { title: 'Active Listening Worksheet', type: 'Worksheet', grade: '3rd Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit 5: Communication Skills', desc: 'Partner activity where students practice reflecting back what they heard.' },
  { title: 'Growth Mindset Poster', type: 'PDF', grade: '4th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit 3: Building Confidence', desc: 'Classroom poster reframing common "I can\'t" statements into growth language.' },
  { title: 'Conflict Resolution Roleplay', type: 'Video', grade: '6th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit 8: Resolving Conflict', desc: 'Modeled roleplay showing two students working through a disagreement.' },
  { title: 'Study Habits Audio Guide', type: 'Audio', grade: '7th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 6: Staying Organized', desc: 'A 6-minute audio walkthrough of building a weekly study routine.' },
  { title: 'Peer Pressure Discussion Cards', type: 'Worksheet', grade: '9th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit 11: Navigating Peer Influence', desc: 'Scenario cards for small-group discussion on navigating peer pressure.' },
  { title: 'Career Goals Reflection', type: 'PDF', grade: '11th Grade', competency: 'Responsible Decision-Making', courseType: 'Family', unit: 'Unit 14: Planning Ahead', desc: 'A guided worksheet for mapping near-term goals to a career interest.' },
  { title: 'Family Wellness Webinar Replay', type: 'Webinar', grade: '2nd Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit 4: Belonging at Home and School', desc: 'Recorded parent session on reinforcing social-awareness skills at home.' },
  { title: 'Understanding Curriculum at Home', type: 'Webinar', grade: '5th Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit 9: Talking About Feelings', desc: 'A live Q&A recording for families new to this vocabulary.' },
  { title: 'Mindful Minute: Full Lesson', type: 'Lesson', grade: 'Kindergarten', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 2: Self-Management Basics', desc: 'Opens the full guided lesson inside the Tier 1 course, not just a standalone clip.' },
  { title: 'Building Empathy: Full Lesson', type: 'Lesson', grade: '8th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit 10: Understanding Others', desc: 'Opens directly into the matching unit and lesson inside the course library.' },
  { title: 'Responsible Choices Case Studies', type: 'Worksheet', grade: '10th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit 13: Weighing Consequences', desc: 'Real-world scenarios for small-group discussion on weighing outcomes.' },
  { title: 'Self-Talk Reframe Cards', type: 'PDF', grade: '2nd Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit 1: Naming Emotions', desc: 'Printable cards pairing common negative self-talk with a reframed alternative.' },
  { title: 'Community Circle Facilitation Guide', type: 'PDF', grade: '6th Grade', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit 8: Resolving Conflict', desc: 'Step-by-step guide for running a restorative community circle discussion.' },
  { title: 'Breathing Break Audio', type: 'Audio', grade: '3rd Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 2: Self-Management Basics', desc: 'A 3-minute guided breathing break for transitioning between subjects.' },
  { title: 'Building Confidence at Home', type: 'Webinar', grade: '4th Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit 3: Building Confidence', desc: 'Recorded family session on reinforcing growth-mindset language at home.' },
  { title: 'Navigating Peer Pressure: Full Lesson', type: 'Lesson', grade: '9th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit 11: Navigating Peer Influence', desc: 'Opens directly into the matching lesson inside the Tier 1 course.' },
  { title: 'Emotion Vocabulary Flashcards', type: 'Worksheet', grade: 'Pre-K', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit 1: Naming Emotions', desc: 'Picture-paired flashcards for building an early emotion vocabulary.' },
  { title: 'Staying Organized Audio Series', type: 'Audio', grade: '12th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 6: Staying Organized', desc: 'A short audio series on building sustainable study systems before graduation.' },
  { title: 'Decision-Making Roleplay Video', type: 'Video', grade: '5th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit 13: Weighing Consequences', desc: 'Modeled roleplay walking through weighing a tough decision out loud.' },
  { title: 'Weekly Check-In Webinar for Families', type: 'Webinar', grade: '8th Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit 8: Resolving Conflict', desc: 'Recorded session on keeping communication open during the middle school years.' },
  { title: 'Pre-K Feelings Check-In Video', type: 'Video', grade: 'Pre-K', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for Pre-K.' },
  { title: 'Pre-K Self-Management Toolkit Guide', type: 'PDF', grade: 'Pre-K', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for Pre-K.' },
  { title: 'Pre-K Communication Skills Worksheet', type: 'Worksheet', grade: 'Pre-K', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A worksheet activity for practicing Relationship Skills.' },
  { title: 'Pre-K Community Building Audio', type: 'Audio', grade: 'Pre-K', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A short audio track supporting Social Awareness practice.' },
  { title: 'Kindergarten Calm-Down Strategies Video', type: 'Video', grade: 'Kindergarten', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for Kindergarten.' },
  { title: 'Kindergarten Building Friendships Guide', type: 'PDF', grade: 'Kindergarten', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for Kindergarten.' },
  { title: 'Kindergarten Perspective-Taking Worksheet', type: 'Worksheet', grade: 'Kindergarten', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A worksheet activity for practicing Social Awareness.' },
  { title: 'Kindergarten Guiding Responsible Choices Webinar', type: 'Webinar', grade: 'Kindergarten', competency: 'Responsible Decision-Making', courseType: 'Family', unit: 'Unit: Weighing Consequences', desc: 'A recorded session for families on supporting Responsible Decision-Making at home.' },
  { title: '1st Grade Active Listening Video', type: 'Video', grade: '1st Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 1st Grade.' },
  { title: '1st Grade Empathy in Action Guide', type: 'PDF', grade: '1st Grade', competency: 'Social Awareness', courseType: 'Tier 2', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 1st Grade.' },
  { title: '1st Grade Decision-Making Scenarios Worksheet', type: 'Worksheet', grade: '1st Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A worksheet activity for practicing Responsible Decision-Making.' },
  { title: '1st Grade Naming Emotions: Full Lesson', type: 'Lesson', grade: '1st Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit: Naming Emotions', desc: 'Opens the full guided lesson inside the course for 1st Grade.' },
  { title: '2nd Grade Understanding Others Video', type: 'Video', grade: '2nd Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 2nd Grade.' },
  { title: '2nd Grade Weighing Consequences Guide', type: 'PDF', grade: '2nd Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 2', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 2nd Grade.' },
  { title: '2nd Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '2nd Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '2nd Grade Guided Breathing Audio', type: 'Audio', grade: '2nd Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A short audio track supporting Self-Management practice.' },
  { title: '3rd Grade Making Good Choices Video', type: 'Video', grade: '3rd Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 3rd Grade.' },
  { title: '3rd Grade Naming Emotions Guide', type: 'PDF', grade: '3rd Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for 3rd Grade.' },
  { title: '3rd Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '3rd Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '3rd Grade Strengthening Peer Relationships Webinar', type: 'Webinar', grade: '3rd Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A recorded session for families on supporting Relationship Skills at home.' },
  { title: '4th Grade Feelings Check-In Video', type: 'Video', grade: '4th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 4th Grade.' },
  { title: '4th Grade Self-Management Toolkit Guide', type: 'PDF', grade: '4th Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 4th Grade.' },
  { title: '4th Grade Communication Skills Worksheet', type: 'Worksheet', grade: '4th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A worksheet activity for practicing Relationship Skills.' },
  { title: '4th Grade Social Awareness: Full Lesson', type: 'Lesson', grade: '4th Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'Opens the full guided lesson inside the course for 4th Grade.' },
  { title: '5th Grade Calm-Down Strategies Video', type: 'Video', grade: '5th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 5th Grade.' },
  { title: '5th Grade Building Friendships Guide', type: 'PDF', grade: '5th Grade', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 5th Grade.' },
  { title: '5th Grade Perspective-Taking Worksheet', type: 'Worksheet', grade: '5th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A worksheet activity for practicing Social Awareness.' },
  { title: '5th Grade Thinking It Through Audio', type: 'Audio', grade: '5th Grade', competency: 'Responsible Decision-Making', courseType: 'Family', unit: 'Unit: Weighing Consequences', desc: 'A short audio track supporting Responsible Decision-Making practice.' },
  { title: '6th Grade Active Listening Video', type: 'Video', grade: '6th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 6th Grade.' },
  { title: '6th Grade Empathy in Action Guide', type: 'PDF', grade: '6th Grade', competency: 'Social Awareness', courseType: 'Tier 2', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 6th Grade.' },
  { title: '6th Grade Decision-Making Scenarios Worksheet', type: 'Worksheet', grade: '6th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A worksheet activity for practicing Responsible Decision-Making.' },
  { title: '6th Grade Understanding Your Child\'s Emotions Webinar', type: 'Webinar', grade: '6th Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit: Naming Emotions', desc: 'A recorded session for families on supporting Self-Awareness at home.' },
  { title: '7th Grade Understanding Others Video', type: 'Video', grade: '7th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 7th Grade.' },
  { title: '7th Grade Weighing Consequences Guide', type: 'PDF', grade: '7th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 2', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 7th Grade.' },
  { title: '7th Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '7th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '7th Grade Self-Management Basics: Full Lesson', type: 'Lesson', grade: '7th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'Opens the full guided lesson inside the course for 7th Grade.' },
  { title: '8th Grade Making Good Choices Video', type: 'Video', grade: '8th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 8th Grade.' },
  { title: '8th Grade Naming Emotions Guide', type: 'PDF', grade: '8th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for 8th Grade.' },
  { title: '8th Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '8th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '8th Grade Conflict Resolution Audio', type: 'Audio', grade: '8th Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A short audio track supporting Relationship Skills practice.' },
  { title: '9th Grade Feelings Check-In Video', type: 'Video', grade: '9th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 9th Grade.' },
  { title: '9th Grade Self-Management Toolkit Guide', type: 'PDF', grade: '9th Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 9th Grade.' },
  { title: '9th Grade Communication Skills Worksheet', type: 'Worksheet', grade: '9th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A worksheet activity for practicing Relationship Skills.' },
  { title: '9th Grade Raising Empathetic Kids Webinar', type: 'Webinar', grade: '9th Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A recorded session for families on supporting Social Awareness at home.' },
  { title: '10th Grade Calm-Down Strategies Video', type: 'Video', grade: '10th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 10th Grade.' },
  { title: '10th Grade Building Friendships Guide', type: 'PDF', grade: '10th Grade', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 10th Grade.' },
  { title: '10th Grade Perspective-Taking Worksheet', type: 'Worksheet', grade: '10th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A worksheet activity for practicing Social Awareness.' },
  { title: '10th Grade Responsible Decision-Making: Full Lesson', type: 'Lesson', grade: '10th Grade', competency: 'Responsible Decision-Making', courseType: 'Family', unit: 'Unit: Weighing Consequences', desc: 'Opens the full guided lesson inside the course for 10th Grade.' },
  { title: '11th Grade Active Listening Video', type: 'Video', grade: '11th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 11th Grade.' },
  { title: '11th Grade Empathy in Action Guide', type: 'PDF', grade: '11th Grade', competency: 'Social Awareness', courseType: 'Tier 2', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 11th Grade.' },
  { title: '11th Grade Decision-Making Scenarios Worksheet', type: 'Worksheet', grade: '11th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A worksheet activity for practicing Responsible Decision-Making.' },
  { title: '11th Grade Mindful Check-In Audio', type: 'Audio', grade: '11th Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit: Naming Emotions', desc: 'A short audio track supporting Self-Awareness practice.' },
  { title: '12th Grade Understanding Others Video', type: 'Video', grade: '12th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 12th Grade.' },
  { title: '12th Grade Weighing Consequences Guide', type: 'PDF', grade: '12th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 2', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 12th Grade.' },
  { title: '12th Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '12th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '12th Grade Supporting Self-Regulation at Home Webinar', type: 'Webinar', grade: '12th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A recorded session for families on supporting Self-Management at home.' },
  { title: 'Pre-K Calm-Down Strategies Video', type: 'Video', grade: 'Pre-K', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for Pre-K.' },
  { title: 'Pre-K Active Listening Video', type: 'Video', grade: 'Pre-K', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for Pre-K.' },
  { title: 'Pre-K Understanding Others Video', type: 'Video', grade: 'Pre-K', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for Pre-K.' },
  { title: 'Pre-K Making Good Choices Video', type: 'Video', grade: 'Pre-K', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for Pre-K.' },
  { title: 'Pre-K Naming Emotions Guide', type: 'PDF', grade: 'Pre-K', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for Pre-K.' },
  { title: 'Pre-K Building Friendships Guide', type: 'PDF', grade: 'Pre-K', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for Pre-K.' },
  { title: 'Pre-K Empathy in Action Guide', type: 'PDF', grade: 'Pre-K', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for Pre-K.' },
  { title: 'Pre-K Weighing Consequences Guide', type: 'PDF', grade: 'Pre-K', competency: 'Responsible Decision-Making', courseType: 'Tier 2', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for Pre-K.' },
  { title: 'Pre-K Managing Big Feelings Worksheet', type: 'Worksheet', grade: 'Pre-K', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: 'Pre-K Perspective-Taking Worksheet', type: 'Worksheet', grade: 'Pre-K', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A worksheet activity for practicing Social Awareness.' },
  { title: 'Kindergarten Active Listening Video', type: 'Video', grade: 'Kindergarten', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for Kindergarten.' },
  { title: 'Kindergarten Understanding Others Video', type: 'Video', grade: 'Kindergarten', competency: 'Social Awareness', courseType: 'Tier 2', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for Kindergarten.' },
  { title: 'Kindergarten Making Good Choices Video', type: 'Video', grade: 'Kindergarten', competency: 'Responsible Decision-Making', courseType: 'Family', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for Kindergarten.' },
  { title: 'Kindergarten Naming Emotions Guide', type: 'PDF', grade: 'Kindergarten', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for Kindergarten.' },
  { title: 'Kindergarten Self-Management Toolkit Guide', type: 'PDF', grade: 'Kindergarten', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for Kindergarten.' },
  { title: 'Kindergarten Empathy in Action Guide', type: 'PDF', grade: 'Kindergarten', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for Kindergarten.' },
  { title: 'Kindergarten Weighing Consequences Guide', type: 'PDF', grade: 'Kindergarten', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for Kindergarten.' },
  { title: 'Kindergarten Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: 'Kindergarten', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: 'Kindergarten Managing Big Feelings Worksheet', type: 'Worksheet', grade: 'Kindergarten', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '1st Grade Feelings Check-In Video', type: 'Video', grade: '1st Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 1st Grade.' },
  { title: '1st Grade Calm-Down Strategies Video', type: 'Video', grade: '1st Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 1st Grade.' },
  { title: '1st Grade Understanding Others Video', type: 'Video', grade: '1st Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 1st Grade.' },
  { title: '1st Grade Making Good Choices Video', type: 'Video', grade: '1st Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 1st Grade.' },
  { title: '1st Grade Naming Emotions Guide', type: 'PDF', grade: '1st Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for 1st Grade.' },
  { title: '1st Grade Building Friendships Guide', type: 'PDF', grade: '1st Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 1st Grade.' },
  { title: '1st Grade Weighing Consequences Guide', type: 'PDF', grade: '1st Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 1st Grade.' },
  { title: '1st Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '1st Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '1st Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '1st Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '1st Grade Communication Skills Worksheet', type: 'Worksheet', grade: '1st Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A worksheet activity for practicing Relationship Skills.' },
  { title: '2nd Grade Feelings Check-In Video', type: 'Video', grade: '2nd Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 2nd Grade.' },
  { title: '2nd Grade Calm-Down Strategies Video', type: 'Video', grade: '2nd Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 2nd Grade.' },
  { title: '2nd Grade Active Listening Video', type: 'Video', grade: '2nd Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 2nd Grade.' },
  { title: '2nd Grade Making Good Choices Video', type: 'Video', grade: '2nd Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 2nd Grade.' },
  { title: '2nd Grade Self-Management Toolkit Guide', type: 'PDF', grade: '2nd Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 2nd Grade.' },
  { title: '2nd Grade Building Friendships Guide', type: 'PDF', grade: '2nd Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 2nd Grade.' },
  { title: '2nd Grade Empathy in Action Guide', type: 'PDF', grade: '2nd Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 2nd Grade.' },
  { title: '2nd Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '2nd Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '2nd Grade Communication Skills Worksheet', type: 'Worksheet', grade: '2nd Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A worksheet activity for practicing Relationship Skills.' },
  { title: '3rd Grade Feelings Check-In Video', type: 'Video', grade: '3rd Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 3rd Grade.' },
  { title: '3rd Grade Calm-Down Strategies Video', type: 'Video', grade: '3rd Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 3rd Grade.' },
  { title: '3rd Grade Active Listening Video', type: 'Video', grade: '3rd Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 3rd Grade.' },
  { title: '3rd Grade Understanding Others Video', type: 'Video', grade: '3rd Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 3rd Grade.' },
  { title: '3rd Grade Self-Management Toolkit Guide', type: 'PDF', grade: '3rd Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 3rd Grade.' },
  { title: '3rd Grade Building Friendships Guide', type: 'PDF', grade: '3rd Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 3rd Grade.' },
  { title: '3rd Grade Empathy in Action Guide', type: 'PDF', grade: '3rd Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 3rd Grade.' },
  { title: '3rd Grade Weighing Consequences Guide', type: 'PDF', grade: '3rd Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 2', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 3rd Grade.' },
  { title: '3rd Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '3rd Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '4th Grade Calm-Down Strategies Video', type: 'Video', grade: '4th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 4th Grade.' },
  { title: '4th Grade Active Listening Video', type: 'Video', grade: '4th Grade', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 4th Grade.' },
  { title: '4th Grade Understanding Others Video', type: 'Video', grade: '4th Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 4th Grade.' },
  { title: '4th Grade Making Good Choices Video', type: 'Video', grade: '4th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 4th Grade.' },
  { title: '4th Grade Building Friendships Guide', type: 'PDF', grade: '4th Grade', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 4th Grade.' },
  { title: '4th Grade Empathy in Action Guide', type: 'PDF', grade: '4th Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 4th Grade.' },
  { title: '4th Grade Weighing Consequences Guide', type: 'PDF', grade: '4th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 4th Grade.' },
  { title: '4th Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '4th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '4th Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '4th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '5th Grade Feelings Check-In Video', type: 'Video', grade: '5th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 5th Grade.' },
  { title: '5th Grade Active Listening Video', type: 'Video', grade: '5th Grade', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 5th Grade.' },
  { title: '5th Grade Understanding Others Video', type: 'Video', grade: '5th Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 5th Grade.' },
  { title: '5th Grade Naming Emotions Guide', type: 'PDF', grade: '5th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for 5th Grade.' },
  { title: '5th Grade Self-Management Toolkit Guide', type: 'PDF', grade: '5th Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 5th Grade.' },
  { title: '5th Grade Empathy in Action Guide', type: 'PDF', grade: '5th Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 5th Grade.' },
  { title: '5th Grade Weighing Consequences Guide', type: 'PDF', grade: '5th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 5th Grade.' },
  { title: '5th Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '5th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '5th Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '5th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '6th Grade Feelings Check-In Video', type: 'Video', grade: '6th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 6th Grade.' },
  { title: '6th Grade Calm-Down Strategies Video', type: 'Video', grade: '6th Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 6th Grade.' },
  { title: '6th Grade Understanding Others Video', type: 'Video', grade: '6th Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 6th Grade.' },
  { title: '6th Grade Making Good Choices Video', type: 'Video', grade: '6th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 6th Grade.' },
  { title: '6th Grade Naming Emotions Guide', type: 'PDF', grade: '6th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for 6th Grade.' },
  { title: '6th Grade Self-Management Toolkit Guide', type: 'PDF', grade: '6th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 6th Grade.' },
  { title: '6th Grade Weighing Consequences Guide', type: 'PDF', grade: '6th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 6th Grade.' },
  { title: '6th Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '6th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '6th Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '6th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '7th Grade Feelings Check-In Video', type: 'Video', grade: '7th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 7th Grade.' },
  { title: '7th Grade Calm-Down Strategies Video', type: 'Video', grade: '7th Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 7th Grade.' },
  { title: '7th Grade Active Listening Video', type: 'Video', grade: '7th Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 7th Grade.' },
  { title: '7th Grade Making Good Choices Video', type: 'Video', grade: '7th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 7th Grade.' },
  { title: '7th Grade Naming Emotions Guide', type: 'PDF', grade: '7th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for 7th Grade.' },
  { title: '7th Grade Self-Management Toolkit Guide', type: 'PDF', grade: '7th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 7th Grade.' },
  { title: '7th Grade Building Friendships Guide', type: 'PDF', grade: '7th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 7th Grade.' },
  { title: '7th Grade Empathy in Action Guide', type: 'PDF', grade: '7th Grade', competency: 'Social Awareness', courseType: 'Tier 2', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 7th Grade.' },
  { title: '7th Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '7th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '7th Grade Communication Skills Worksheet', type: 'Worksheet', grade: '7th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A worksheet activity for practicing Relationship Skills.' },
  { title: '8th Grade Feelings Check-In Video', type: 'Video', grade: '8th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 8th Grade.' },
  { title: '8th Grade Calm-Down Strategies Video', type: 'Video', grade: '8th Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 8th Grade.' },
  { title: '8th Grade Active Listening Video', type: 'Video', grade: '8th Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 8th Grade.' },
  { title: '8th Grade Understanding Others Video', type: 'Video', grade: '8th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 8th Grade.' },
  { title: '8th Grade Self-Management Toolkit Guide', type: 'PDF', grade: '8th Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 8th Grade.' },
  { title: '8th Grade Building Friendships Guide', type: 'PDF', grade: '8th Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 8th Grade.' },
  { title: '8th Grade Empathy in Action Guide', type: 'PDF', grade: '8th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 8th Grade.' },
  { title: '8th Grade Weighing Consequences Guide', type: 'PDF', grade: '8th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 2', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 8th Grade.' },
  { title: '8th Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '8th Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '9th Grade Calm-Down Strategies Video', type: 'Video', grade: '9th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 9th Grade.' },
  { title: '9th Grade Active Listening Video', type: 'Video', grade: '9th Grade', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 9th Grade.' },
  { title: '9th Grade Understanding Others Video', type: 'Video', grade: '9th Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 9th Grade.' },
  { title: '9th Grade Making Good Choices Video', type: 'Video', grade: '9th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 9th Grade.' },
  { title: '9th Grade Naming Emotions Guide', type: 'PDF', grade: '9th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for 9th Grade.' },
  { title: '9th Grade Building Friendships Guide', type: 'PDF', grade: '9th Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 9th Grade.' },
  { title: '9th Grade Empathy in Action Guide', type: 'PDF', grade: '9th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 9th Grade.' },
  { title: '9th Grade Weighing Consequences Guide', type: 'PDF', grade: '9th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 2', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 9th Grade.' },
  { title: '9th Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '9th Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '10th Grade Feelings Check-In Video', type: 'Video', grade: '10th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 10th Grade.' },
  { title: '10th Grade Active Listening Video', type: 'Video', grade: '10th Grade', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 10th Grade.' },
  { title: '10th Grade Understanding Others Video', type: 'Video', grade: '10th Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 10th Grade.' },
  { title: '10th Grade Making Good Choices Video', type: 'Video', grade: '10th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 10th Grade.' },
  { title: '10th Grade Naming Emotions Guide', type: 'PDF', grade: '10th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for 10th Grade.' },
  { title: '10th Grade Self-Management Toolkit Guide', type: 'PDF', grade: '10th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 10th Grade.' },
  { title: '10th Grade Empathy in Action Guide', type: 'PDF', grade: '10th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 10th Grade.' },
  { title: '10th Grade Weighing Consequences Guide', type: 'PDF', grade: '10th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 2', unit: 'Unit: Weighing Consequences', desc: 'A printable guide supporting Responsible Decision-Making for 10th Grade.' },
  { title: '10th Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '10th Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '10th Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '10th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '11th Grade Feelings Check-In Video', type: 'Video', grade: '11th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 11th Grade.' },
  { title: '11th Grade Calm-Down Strategies Video', type: 'Video', grade: '11th Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 11th Grade.' },
  { title: '11th Grade Understanding Others Video', type: 'Video', grade: '11th Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Understanding Others', desc: 'A short video introducing social awareness concepts for 11th Grade.' },
  { title: '11th Grade Making Good Choices Video', type: 'Video', grade: '11th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 11th Grade.' },
  { title: '11th Grade Naming Emotions Guide', type: 'PDF', grade: '11th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for 11th Grade.' },
  { title: '11th Grade Self-Management Toolkit Guide', type: 'PDF', grade: '11th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 11th Grade.' },
  { title: '11th Grade Building Friendships Guide', type: 'PDF', grade: '11th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 11th Grade.' },
  { title: '11th Grade Self-Awareness Reflection Worksheet', type: 'Worksheet', grade: '11th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A worksheet activity for practicing Self-Awareness.' },
  { title: '11th Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '11th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '11th Grade Communication Skills Worksheet', type: 'Worksheet', grade: '11th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A worksheet activity for practicing Relationship Skills.' },
  { title: '12th Grade Feelings Check-In Video', type: 'Video', grade: '12th Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit: Naming Emotions', desc: 'A short video introducing self-awareness concepts for 12th Grade.' },
  { title: '12th Grade Calm-Down Strategies Video', type: 'Video', grade: '12th Grade', competency: 'Self-Management', courseType: 'Tier 2', unit: 'Unit: Self-Management Basics', desc: 'A short video introducing self-management concepts for 12th Grade.' },
  { title: '12th Grade Active Listening Video', type: 'Video', grade: '12th Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Communication Skills', desc: 'A short video introducing relationship skills concepts for 12th Grade.' },
  { title: '12th Grade Making Good Choices Video', type: 'Video', grade: '12th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit: Weighing Consequences', desc: 'A short video introducing responsible decision-making concepts for 12th Grade.' },
  { title: '12th Grade Naming Emotions Guide', type: 'PDF', grade: '12th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit: Naming Emotions', desc: 'A printable guide supporting Self-Awareness for 12th Grade.' },
  { title: '12th Grade Self-Management Toolkit Guide', type: 'PDF', grade: '12th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A printable guide supporting Self-Management for 12th Grade.' },
  { title: '12th Grade Building Friendships Guide', type: 'PDF', grade: '12th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A printable guide supporting Relationship Skills for 12th Grade.' },
  { title: '12th Grade Empathy in Action Guide', type: 'PDF', grade: '12th Grade', competency: 'Social Awareness', courseType: 'Tier 2', unit: 'Unit: Understanding Others', desc: 'A printable guide supporting Social Awareness for 12th Grade.' },
  { title: '12th Grade Managing Big Feelings Worksheet', type: 'Worksheet', grade: '12th Grade', competency: 'Self-Management', courseType: 'Family', unit: 'Unit: Self-Management Basics', desc: 'A worksheet activity for practicing Self-Management.' },
  { title: '12th Grade Communication Skills Worksheet', type: 'Worksheet', grade: '12th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit: Communication Skills', desc: 'A worksheet activity for practicing Relationship Skills.' },
]

// ── Shared leaf pieces, used by two or more of B/C/D ──

// `children` (Concept C's grade breadcrumb) renders inside the same banded
// strip as the search row, so the sticky header reads as one cohesive block
// instead of a teal-tinted search band followed by a separate, disconnected
// breadcrumb line sitting in the plain page background below it.
function SearchBand({ children, value, onChange }) {
  return (
    <div className="w-screen mx-[calc(50%-50vw)] bg-brand-bg border-b border-brand-border sticky top-14 z-40">
      <div className="px-6 pt-[1.35rem] pb-4 flex flex-col gap-3">
        <div className="flex items-stretch gap-4">
          <div className="relative w-[500px] shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search by competency or file type"
              className="w-full pl-10 pr-9 h-11 text-sm border border-brand-border rounded-full bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            />
          </div>
          <button type="button" className="shrink-0 px-6 h-11 rounded-full text-sm font-semibold bg-dessa-teal text-white hover:bg-dessa-teal/90 transition-colors">
            Search
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function GateHeading({ heading, subcopy }) {
  return (
    <>
      <h1 className="text-4xl font-semibold text-brand-text mb-1">{heading}</h1>
      <p className="text-base text-brand-subtext mb-8 max-w-xl">{subcopy}</p>
    </>
  )
}

// Shared "open a resource" destination for B/C/D's rows/cards and E's own
// results rows (see ResourcesDashE) — a real navigate-to-it action rather
// than the dead click these previously had. Modeled on this codebase's
// existing plain-modal convention (CurriculumSetup.jsx), not Radix Dialog,
// since that package isn't installed here and this is simple enough not to
// need it.
function ResourceDetailModal({ resource, onClose }) {
  if (!resource) return null
  const typeMeta = TYPE_META[resource.type]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-brand-subtext hover:text-brand-text transition-colors"
        >
          <X size={18} />
        </button>
        <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full mb-4 ${typeMeta.bg} bg-opacity-10 ${typeMeta.color}`}>
          <typeMeta.icon size={14} />
          <span className="text-xs font-medium">{typeMeta.label}</span>
        </span>
        <h3 className="text-xl font-semibold text-brand-text mb-1.5">{resource.title}</h3>
        <p className="text-sm text-brand-subtext mb-4">{resource.unit} · {resource.grade}</p>
        <p className="text-sm text-brand-text leading-relaxed mb-6">{resource.desc}</p>
        <span className="inline-flex px-2.5 py-1 rounded-full bg-brand-bg text-brand-text text-xs font-medium">{resource.competency}</span>
      </div>
    </div>
  )
}

function ResultRows({ rows, showDividers, onSelect }) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-lg font-semibold text-brand-text mb-1.5">No resources found</p>
        <p className="text-sm text-brand-subtext max-w-sm mx-auto">Try adjusting your keywords or clearing the filters.</p>
      </div>
    )
  }
  return (
    <div className="border-t border-brand-border">
      {rows.map((r, i) => {
        const showDivider = showDividers && (i === 0 || rows[i - 1].grade !== r.grade)
        const isLast = i === rows.length - 1
        const typeMeta = TYPE_META[r.type]
        return (
          <div key={r.title}>
            {showDivider && (
              <div
                className="px-6 py-2 border-b border-brand-border text-xs font-semibold text-brand-text uppercase tracking-wide"
                style={{ backgroundColor: 'rgba(241,242,245,0.29)' }}
              >
                {r.grade}
              </div>
            )}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(r)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelect?.(r)
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-[rgba(15,148,172,0.1)] transition-colors cursor-pointer ${
                isLast ? 'rounded-b-2xl' : 'border-b border-brand-border'
              }`}
            >
              {/* Title/unit is a fixed (but still shrinkable) width rather
                  than flex-1, so the description column's left edge lands
                  in the same place on every row — with both columns as
                  flex-1, that boundary used to be wherever the trailing
                  badge cluster's own (row-by-row varying) width happened to
                  leave it. No shrink-0 here though: it still compresses
                  via min-w-0 + truncate rather than overflowing when the
                  container is narrower than a full-width page — e.g.
                  Concept B's permanent sidebar eats real width that the
                  no-sidebar "Current" page doesn't have to share. Only the
                  trailing badge cluster stays shrink-0. */}
              <div className="w-64 min-w-0">
                <p className="text-[16px] font-semibold text-brand-text truncate">{r.title}</p>
                <p className="text-xs text-brand-subtext truncate mt-0.5">{r.unit}</p>
              </div>
              <p className="hidden lg:block flex-1 min-w-0 truncate text-left text-sm text-brand-subtext">{r.desc}</p>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-[5px] whitespace-nowrap ${typeMeta.bg} bg-opacity-10 ${typeMeta.color}`}>
                  <typeMeta.icon size={14} />
                  <span className="text-xs font-medium">{typeMeta.label}</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-[5px] bg-brand-bg text-brand-text text-xs font-medium max-w-[160px] truncate">
                  {r.competency}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ResultsHeader({ chips, count, right }) {
  return (
    <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {typeof count === 'number' && (
          <span className="text-sm text-brand-subtext">
            {count} {count === 1 ? 'resource' : 'resources'}
          </span>
        )}
        {chips.map((c) => (
          <span key={c} className="inline-flex items-center pl-3 pr-3 py-1.5 rounded-full bg-dessa-tealLight text-dessa-teal text-sm font-medium">
            {c}
          </span>
        ))}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

// ── Shared results-view piece, used by C/D/E ──
// List vs. Cards display, orthogonal to which entry concept (C/D/E) got you
// here. Held in resourcesConceptContext so the preference persists across
// switching entry concepts, but the control for it lives in the results UI
// itself, not the global nav — it only means something once you're looking
// at results. (The old Bar vs. Sidebar filter-mechanic axis this used to
// pair with was removed 2026-09-16 — FilterBarShared is now the only
// filter mechanic, used everywhere.)

function SegToggle({ options, value, onChange }) {
  return (
    <div className="flex items-center rounded-md border border-brand-border overflow-hidden text-xs font-medium shrink-0">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.title}
          aria-label={opt.title}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-colors ${i > 0 ? 'border-l border-brand-border' : ''} ${
            value === opt.value ? 'bg-dessa-teal text-white' : 'text-brand-subtext hover:bg-brand-bg'
          }`}
        >
          <opt.icon size={13} />
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ResultsCards({ rows, onSelect }) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-lg font-semibold text-brand-text mb-1.5">No resources found</p>
        <p className="text-sm text-brand-subtext max-w-sm mx-auto">Try adjusting your keywords or clearing the filters.</p>
      </div>
    )
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 pb-6">
      {rows.map((r) => {
        const typeMeta = TYPE_META[r.type]
        return (
          <div
            key={r.title}
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(r)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSelect?.(r)
            }}
            className="rounded-xl border border-brand-border bg-white p-4 flex flex-col gap-3 hover:border-dessa-teal/40 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-[5px] ${typeMeta.bg} bg-opacity-10 ${typeMeta.color}`}>
                <typeMeta.icon size={14} />
                <span className="text-xs font-medium">{typeMeta.label}</span>
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-[5px] bg-brand-bg text-brand-text text-xs font-medium shrink-0">
                {r.competency}
              </span>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-brand-text leading-snug">{r.title}</p>
              <p className="text-xs text-brand-subtext mt-0.5">{r.unit}</p>
            </div>
            <p className="text-sm text-brand-subtext leading-relaxed">{r.desc}</p>
          </div>
        )
      })}
    </div>
  )
}

// Now the single filter mechanic used everywhere (2026-09-16, per manager
// feedback — the old Bar/Sidebar toggle and FilterSidebarShared are gone).
// Grade is a facet here too as of the same change, rather than staying
// fixed-by-entry-gate-only, so any concept using this bar can broaden/
// re-narrow past whatever grade got you here without leaving the page.
// Single-select (radio, not checkbox) — you're always looking at exactly
// one grade scope (a specific grade, or "All Grades") at a time, never a
// combination of several, unlike the other three facets.
function FilterBarShared({ grades, courseTypes, competencies, types, onSelectGrade, onToggleCourseType, onToggleCompetency, onToggleType, onResetAll }) {
  const [expanded, setExpanded] = useState(false)
  // A specific grade counts as "active" the same way a non-empty
  // Course Type/Competency/Type selection does — "All Grades" is the
  // unrestricted default, not a real filter — so this dot means the same
  // thing whether it's Grade or any other facet that's engaged.
  const hasActiveFilters = (grades[0] && grades[0] !== 'All Grades') || courseTypes.length > 0 || competencies.length > 0 || types.length > 0
  return (
    <div className="mb-6 rounded-2xl border border-brand-border bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-1.5 px-5 py-4 text-base font-semibold text-brand-text"
      >
        Filters
        {hasActiveFilters && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-dessa-teal" />}
        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-5 pt-5 pb-5 border-t border-brand-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FilterField label="Grade" options={SELECTABLE_GRADES} selected={grades} onToggle={onSelectGrade} single />
            <FilterField label="Course Type" options={COURSE_TYPES} selected={courseTypes} onToggle={onToggleCourseType} />
            <FilterField label="Competency" options={COMPETENCIES} selected={competencies} onToggle={onToggleCompetency} />
            <FilterField
              label="Type"
              options={Object.keys(TYPE_META).map((t) => TYPE_META[t].label)}
              selected={types.map((t) => TYPE_META[t].label)}
              onToggle={(label) => onToggleType(Object.keys(TYPE_META).find((t) => TYPE_META[t].label === label))}
            />
          </div>
          <div className="flex items-center gap-4 mt-5">
            <button type="button" onClick={onResetAll} className="text-sm font-medium text-brand-subtext hover:text-brand-text transition-colors">
              Reset filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterField({ label, options, selected, onToggle, single = false }) {
  const [open, setOpen] = useState(false)
  const summary = selected.length === 0 ? 'All' : selected.length === 1 ? selected[0] : `${selected.length} selected`
  return (
    <div className="flex flex-col gap-1.5 relative">
      <p className="text-sm font-semibold text-brand-text">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 h-10 px-3 text-sm border border-brand-border rounded-md bg-white text-brand-subtext hover:border-dessa-teal/50 transition-colors"
      >
        <span className="truncate text-left">{summary}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full z-30 bg-white border border-brand-border rounded-xl shadow-lg p-2 max-h-56 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                role={single ? 'radio' : 'checkbox'}
                aria-checked={isSelected}
                onClick={() => {
                  onToggle(opt)
                  if (single) setOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                  isSelected ? 'bg-[rgba(15,148,172,0.1)] text-brand-text' : 'text-brand-text hover:bg-brand-bg'
                }`}
              >
                <span className={`w-4 h-4 flex items-center justify-center shrink-0 border-2 ${single ? 'rounded-full' : 'rounded'} ${isSelected ? 'bg-dessa-teal border-dessa-teal' : 'border-brand-border'}`}>
                  {isSelected && (single
                    ? <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    : <Check size={11} strokeWidth={3} className="text-white" />
                  )}
                </span>
                <span className="truncate">{opt}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const RESULTS_VIEW_OPTIONS = [
  { value: 'list', label: 'List', icon: LayoutList, title: 'List view' },
  { value: 'cards', label: 'Cards', icon: LayoutGrid, title: 'Card view' },
]

// Shared post-gate results experience for C/D: same grade-scoped data, same
// filter bar (FilterBarShared, the sole surviving filter mechanic — the old
// Bar/Sidebar toggle and FilterSidebarShared were removed 2026-09-16 per
// manager feedback, standardizing every concept on Concept D's original
// filter), and now always its own search field above that bar, so the only
// thing that differs between concepts is how you arrive here (the gate
// itself) — not what the results look like once you have. `topLeft` is
// each concept's own way of surfacing/changing the current grade (a
// "Browse a different grade" link for C, nothing for D since its whole
// premise is nav-hover-only). The Grade facet inside FilterBarShared lets
// you broaden/re-narrow past whatever grade the entry gate fixed, without
// leaving the page.
function ResultsExperience({ grade, topLeft }) {
  const { resultsView, setResultsView } = useResourcesConcept()
  // Single-select, seeded from the entry gate's grade — always exactly one
  // value ("All Grades" included), never a combination, so this stays a
  // plain single value rather than the array the other facets use.
  const [selectedGrade, setSelectedGrade] = useState(grade)
  const [courseTypes, setCourseTypes] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [types, setTypes] = useState([])
  const [selected, setSelected] = useState(null)
  const [ownQuery, setOwnQuery] = useState('')

  function toggle(setFn, current, value) {
    setFn(current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }
  function resetAll() {
    setSelectedGrade('All Grades')
    setCourseTypes([])
    setCompetencies([])
    setTypes([])
  }

  // No separate hard grade constraint from the entry gate — `selectedGrade`
  // above already starts seeded to it, but from here it's a facet like any
  // other (same convention as ResultsDashE), so switching it means the
  // entry grade no longer applies.
  let rows = MOCK_RESOURCES
  if (selectedGrade !== 'All Grades') rows = rows.filter((r) => r.grade === selectedGrade)
  const q = ownQuery.trim().toLowerCase()
  if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q))
  if (courseTypes.length) rows = rows.filter((r) => courseTypes.includes(r.courseType))
  if (competencies.length) rows = rows.filter((r) => competencies.includes(r.competency))
  if (types.length) rows = rows.filter((r) => types.includes(r.type))

  const filterProps = {
    grades: [selectedGrade], courseTypes, competencies, types,
    onSelectGrade: setSelectedGrade,
    onToggleCourseType: (v) => toggle(setCourseTypes, courseTypes, v),
    onToggleCompetency: (v) => toggle(setCompetencies, competencies, v),
    onToggleType: (v) => toggle(setTypes, types, v),
    onResetAll: resetAll,
  }
  // Grade no longer shows as its own chip here (2026-09-16) — with grade
  // single-select and basically always "on," a permanent pill just read as
  // clutter/redundant with the Filters bar's own dot indicator below.
  const chips = [...courseTypes, ...competencies, ...types.map((t) => TYPE_META[t].label)]

  return (
    <div className="px-6 pt-2 pb-16">
      <div className="mb-4">{topLeft}</div>
      <div className="flex items-stretch gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
          <input
            type="text"
            value={ownQuery}
            onChange={(e) => setOwnQuery(e.target.value)}
            placeholder="Search guides, videos, worksheets..."
            className="w-full pl-11 pr-4 h-11 rounded-full border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
          />
        </div>
        <button type="button" className="shrink-0 px-6 h-11 rounded-full text-sm font-semibold bg-dessa-teal text-white hover:bg-dessa-teal/90 transition-colors">
          Search
        </button>
      </div>
      <FilterBarShared {...filterProps} />
      <div className="flex-1 min-w-0 rounded-2xl border border-brand-border bg-white">
        <ResultsHeader
          chips={chips}
          count={rows.length}
          right={<SegToggle options={RESULTS_VIEW_OPTIONS} value={resultsView} onChange={setResultsView} />}
        />
        {resultsView === 'cards' ? <ResultsCards rows={rows} onSelect={setSelected} /> : <ResultRows rows={rows} showDividers={false} onSelect={setSelected} />}
      </div>
      <ResourceDetailModal resource={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function slugifyGrade(label) {
  return label.toLowerCase().replace(/\s+/g, '-')
}

// One tier per grade band, each with its own brand-color gradient + icon —
// a colorful, "inviting" placeholder tile (bold gradient + icon in a
// translucent circle, avatar-placeholder-style) rather than a flat gray box,
// per explicit feedback that the plain gray+icon treatment wasn't inviting.
// Falls through to 'All Grades' for anything that isn't a specific grade.
// `iconColor` is a full literal class string (not built from a variable via
// a template string) so Tailwind's JIT scanner — which greps this file's raw
// text, not runtime output — actually finds and generates it.
// `tintRgba` (the card's own hex color, restated as rgb() for inline-style
// use) drives the top-of-card gradient as a real CSS background-image
// rather than a Tailwind class — a percentage `height` on an absolutely
// positioned overlay only resolves against a parent with an *explicit*
// height, and these cards size to their content, so that approach silently
// collapses to nothing. A gradient background-image's percentage color
// stops, by contrast, scale correctly against the box's own final rendered
// size regardless of whether that height is auto or fixed.
const CARD_TIERS = [
  { test: (g) => ELEMENTARY_GROUP.includes(g), icon: BookOpen, gradient: 'from-mtw-amber to-mtw-coral', tintRgba: '245,166,35', iconColor: 'text-mtw-amber' },
  { test: (g) => MIDDLE_GROUP.includes(g), icon: Users, gradient: 'from-mtw-teal to-dessa-teal', tintRgba: '45,125,120', iconColor: 'text-mtw-teal' },
  { test: (g) => HIGH_GROUP.includes(g), icon: GraduationCap, gradient: 'from-mtw-blue to-mtw-purple', tintRgba: '59,125,216', iconColor: 'text-mtw-blue' },
  { test: () => true, icon: Layers, gradient: 'from-dessa-teal to-mtw-amber', tintRgba: '42,127,143', iconColor: 'text-dessa-teal' },
]

function tierFor(grade) {
  return CARD_TIERS.find((t) => t.test(grade))
}

// Real <img> pointing at an expected-but-not-yet-supplied file path, falling
// back to the tiered gradient+icon tile on error — so dropping real photos
// into /public/resources-grade-cards/ later requires zero code changes.
function GradeCardImage({ grade, className = '' }) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    const { icon: Icon, gradient } = tierFor(grade)
    return (
      <div className={`relative bg-gradient-to-br ${gradient} flex items-center justify-center ${className}`}>
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
          <Icon size={26} className="text-white" strokeWidth={1.75} />
        </div>
      </div>
    )
  }
  return (
    <img
      src={`/resources-grade-cards/${slugifyGrade(grade)}.jpg`}
      alt=""
      onError={() => setErrored(true)}
      className={`object-cover ${className}`}
    />
  )
}

const SUBCOPY = 'Lesson videos, worksheets, and guides organized by grade and competency.'

// A facet is just a label + checkbox list, meant to sit inside Concept B's
// own sidebar card — not boxed in its own nested border, so the sidebar
// reads as one unified card rather than a stack of loose mini-cards next
// to the results panel.
function PlainFacetGroup({ label, options, selected, onToggle, scroll }) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-text mb-3">{label}</p>
      <div className={`flex flex-col gap-2 ${scroll ? 'max-h-48 overflow-y-auto pr-1' : ''}`}>
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="accent-dessa-teal w-3.5 h-3.5"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )
}

// Small hand-drawn-feeling doodle marks for Concept B's hero — deliberately
// wobbly/uneven paths (not clean geometric icons) so they read as a
// childlike scribble rather than another UI icon. Solid-filled/stroked at
// full opacity ("opaque vector shapes"), not fainted out, since the ask was
// for playful corner accents, not a background texture.
function DoodleSquiggle({ className = '' }) {
  return (
    <svg viewBox="0 0 40 16" width="40" height="16" className={className} fill="none">
      <path d="M2 8c2-6 5-6 7 0s5 6 7 0 5-6 7 0 5 6 7 0 4-5 6-1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function DoodleSpark({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} fill="currentColor">
      <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
    </svg>
  )
}

function DoodleSwirl({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" className={className} fill="none">
      <path d="M17 27c-6 1-11-3-11-9s4-10 9-10c4 0 7 2 7 6 0 3-2 5-5 5s-4-1.5-4-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ── Concept B — Everything visible, filter down ──
// (was sandbox "Concept A") — a centered marketing-style hero (large H1,
// hand-drawn doodle corner accents) sits above a plain utility body: a
// search bar in its own small container, and a persistent left filter
// sidebar next to results that are visible immediately — no grade gate,
// upfront or fused, anywhere. This is the deliberate control concept,
// testing whether the mandatory gate is needed at all; the hero treatment
// (2026-09-15) is purely decorative delight on top of that premise, not a
// change to the underlying no-gate mechanism.
//
// B's sidebar is its own thing, deliberately left untouched by the
// 2026-09-16 filter-mechanic cleanup that put C/D onto the shared
// FilterBarShared — the left-panel layout is part of this concept's
// identity, the one place that's explicitly being tested against the
// bar filter used everywhere else. Results view (List/Cards) still comes
// from the shared context, since that axis is genuinely orthogonal to how
// filtering is presented.
export function ConceptB() {
  const { resultsView, setResultsView } = useResourcesConcept()
  const [grades, setGrades] = useState([])
  const [courseTypes, setCourseTypes] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [types, setTypes] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  function toggle(setFn, current, value) {
    setFn(current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }
  function resetAll() {
    setGrades([])
    setCourseTypes([])
    setCompetencies([])
    setTypes([])
  }

  const q = search.trim().toLowerCase()
  let rows = MOCK_RESOURCES
  if (grades.length) rows = rows.filter((r) => grades.includes(r.grade))
  if (courseTypes.length) rows = rows.filter((r) => courseTypes.includes(r.courseType))
  if (competencies.length) rows = rows.filter((r) => competencies.includes(r.competency))
  if (types.length) rows = rows.filter((r) => types.includes(r.type))
  if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q))
  const hasActiveFilters = grades.length > 0 || courseTypes.length > 0 || competencies.length > 0 || types.length > 0
  const chips = [...grades, ...courseTypes, ...competencies, ...types.map((t) => TYPE_META[t].label)]

  return (
    <div className="px-6 pb-16">
      {/* Hero: centered, large heading with hand-drawn doodle accents
          framing the corners — decorative only, doesn't touch the no-gate
          premise below it. Accents sit outside the heading's own text flow
          (absolutely positioned within this relative block) so they never
          crowd or compete with the copy itself. */}
      <div className="w-screen mx-[calc(50%-50vw)] border-t border-b border-brand-border mb-6">
        <div className="relative flex flex-col items-center justify-center text-center h-[24vh] p-[78px] bg-[#00325b]">
          <DoodleSquiggle className="hidden sm:block absolute top-4 left-6 text-mtw-amber -rotate-6" />
          <DoodleSpark className="absolute top-2 right-10 text-mtw-coral rotate-12" />
          <DoodleSwirl className="hidden sm:block absolute bottom-0 left-16 text-mtw-teal rotate-3" />
          <DoodleSpark className="hidden sm:block absolute bottom-2 right-24 text-mtw-teal -rotate-6" />
          <DoodleSquiggle className="absolute bottom-6 right-4 text-mtw-amber rotate-3" />
          <h1 className="relative text-4xl font-semibold text-white">Resources</h1>
        </div>
      </div>

      {/* Search bar: its own full-width row, sitting above the
          sidebar+results split entirely (not scoped to either column). */}
      <div className="flex items-stretch gap-2.5 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides, videos, worksheets..."
            className="w-full pl-11 pr-4 h-11 rounded-full border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
          />
        </div>
        <button type="button" className="shrink-0 px-6 h-11 rounded-full text-sm font-semibold bg-dessa-teal text-white hover:bg-dessa-teal/90 transition-colors">
          Search
        </button>
      </div>

      {/* Sidebar is one unified card (matching the results panel's
          border/radius/bg) instead of a stack of individually-boxed facet
          groups — the two columns read as a matched pair rather than
          "loose boxes" next to "one solid card". */}
      <div className="flex gap-6 items-start">
        <div className="w-64 shrink-0 rounded-2xl border border-brand-border bg-white p-5 flex flex-col gap-5">
          <p className="text-base font-semibold text-brand-text">Filters</p>
          <PlainFacetGroup label="Grade" options={SELECTABLE_GRADES} selected={grades} onToggle={(v) => toggle(setGrades, grades, v)} scroll />
          <PlainFacetGroup label="Course Type" options={COURSE_TYPES} selected={courseTypes} onToggle={(v) => toggle(setCourseTypes, courseTypes, v)} />
          <PlainFacetGroup label="Competency" options={COMPETENCIES} selected={competencies} onToggle={(v) => toggle(setCompetencies, competencies, v)} />
          <PlainFacetGroup label="Type" options={Object.keys(TYPE_META)} selected={types} onToggle={(v) => toggle(setTypes, types, v)} />
          <button
            type="button"
            onClick={resetAll}
            disabled={!hasActiveFilters}
            className="w-full px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors disabled:bg-brand-border disabled:text-brand-subtext"
          >
            Reset all filters
          </button>
        </div>

        <div className="flex-1 min-w-0 rounded-2xl border border-brand-border bg-white">
          <ResultsHeader
            chips={chips}
            count={rows.length}
            right={<SegToggle options={RESULTS_VIEW_OPTIONS} value={resultsView} onChange={setResultsView} />}
          />
          {resultsView === 'cards' ? <ResultsCards rows={rows} onSelect={setSelected} /> : <ResultRows rows={rows} showDividers={grades.length !== 1} onSelect={setSelected} />}
        </div>
      </div>
      <ResourceDetailModal resource={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Concept C — Visual browse cards ──
// (was sandbox "Concept D") — pure card-grid landing, one card per
// individual grade. Now the sole home for the card-grid pattern (absorbed
// from Concept B's now-removed duplicate grid, 2026-09-12). Each card shows
// a real photo via GradeCardImage — falls back to an icon tile if the file
// isn't there yet, so real photos can be dropped into
// /public/resources-grade-cards/ later with no code changes.
// Card composition and search field modeled on a reference screenshot (a
// help-center dashboard: search bar up top, a small-caps section label,
// then a grid of plain icon+title+description cards — no photo, no
// button). Grade selection now reuses Concept E's PairedSearchField
// verbatim (staged pendingGrade, confirmed activeGrade, same handleSubmit
// semantics) instead of a separate search band bolted on after the fact —
// a grade card click confirms immediately (skips staging), same as
// picking a grade from the field's own dropdown post-gate.
function gradeCardDescription(grade) {
  return grade === 'All Grades'
    ? 'Browse the full library across every grade level.'
    : `Browse lesson videos, worksheets, and guides for ${grade}.`
}

export function ConceptC() {
  const [activeGrade, setActiveGrade] = useState(null)

  if (!activeGrade) {
    return (
      <div className="pt-10 pb-16 px-6">
        <div className="flex flex-col items-center text-center py-12">
          <GateHeading heading="Curriculum Resource Library" subcopy={SUBCOPY} />
        </div>
        <p className="text-xs font-semibold text-brand-subtext uppercase tracking-wide mb-4">Browse by Grade</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SELECTABLE_GRADES.map((g) => {
            const { icon: Icon, tintRgba, iconColor } = tierFor(g)
            return (
              <button
                key={g}
                type="button"
                onClick={() => setActiveGrade(g)}
                style={{ backgroundImage: `linear-gradient(to bottom, rgba(${tintRgba},0.19), transparent 25%)` }}
                className="overflow-hidden text-left rounded-2xl border border-brand-border/70 bg-white p-5 hover:border-dessa-teal/40 hover:shadow-sm transition-all"
              >
                <Icon size={34} className={`${iconColor} mb-4`} strokeWidth={1.5} />
                <p className="text-base font-semibold text-brand-text mb-1.5">{g}</p>
                <p className="text-sm text-brand-subtext leading-relaxed line-clamp-3">{gradeCardDescription(g)}</p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <ResultsExperience
      key={activeGrade}
      grade={activeGrade}
      topLeft={
        <p className="text-sm">
          <span className="text-brand-subtext">Resources</span>
          <span className="mx-1.5 text-brand-border">/</span>
          <span className="font-semibold text-brand-text">{activeGrade}</span>
          <span className="mx-1.5 text-brand-border">·</span>
          <button type="button" onClick={() => setActiveGrade(null)} className="font-medium text-dessa-teal hover:underline">
            Browse a different grade
          </button>
        </p>
      }
    />
  )
}

// ── Concept D — Nav hover only, no page of its own ──
// (was sandbox "Concept E") — the only way in is hovering "Resources" in
// the real global nav (see Nav.jsx, gated on resourcesConcept === 'd') and
// picking a grade, which sets the `grade` URL param this reads. Filter bar
// (FilterBarShared) + row list below, same shared results experience C
// uses. Grade is derived straight from the URL param and never changes without
// leaving via the nav hover again — no inline "change grade" control here,
// which reinforces rather than undermines the concept's premise (hovering
// the nav is the *only* way in, not just the first way in).
export function ConceptD() {
  const [searchParams] = useSearchParams()
  const selectedGrade = searchParams.get('grade')

  if (!selectedGrade) {
    return (
      <div className="w-screen mx-[calc(50%-50vw)] flex justify-center py-24 px-6">
        <div className="max-w-md flex flex-col items-center gap-3 text-center">
          <MousePointerClick size={20} className="text-dessa-teal" />
          <p className="text-sm text-brand-subtext">
            Hover <span className="font-semibold text-brand-text">Resources</span> in the nav above and pick a
            grade — there's no page here otherwise, hovering is the only way in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ResultsExperience
      key={selectedGrade}
      grade={selectedGrade}
      topLeft={
        <p className="text-sm">
          <span className="text-brand-subtext">Resources</span>
          <span className="mx-1.5 text-brand-border">/</span>
          <span className="font-semibold text-brand-text">{selectedGrade}</span>
        </p>
      }
    />
  )
}

// ── Concept E — Paired grade + search field ──
// Explores whether grade selection needs to be a separate mandatory step at
// all (the A/C/D gate, and the version of B that was considered) — or
// whether it can just be baked into the search field itself, the way a
// flight-search combo box fuses origin/destination into one control. B is
// left completely untouched (its search bar/pill row are still ungated); E
// is a distinct concept so the two can be compared side by side rather than
// B being modified in place.
// Mechanism: pressing Search (or Enter) with no grade chosen doesn't run a
// gradeless search and doesn't block with an error either — it just opens
// the grade dropdown, since picking a grade IS what was missing to complete
// the search, not a prerequisite screen before it.
// Grade selector redesigned (2026-09-12) from a left-side segmented field
// into a rounded-full chip floating inside the search bar's right edge,
// 12px in — reads as a filter chip riding inside the field rather than a
// separate joined segment. A visible Search button now sits just to the
// right of that chip (both in one right-anchored cluster) — Enter still
// submits too, but a field with no visible way to submit besides Enter
// isn't a safe assumption for every user to discover.
function PairedSearchField({ grade, onGradeChange, query, onQueryChange, open, onOpenChange, onSubmit, maxWidthClassName = 'max-w-2xl', gradePlaceholder = 'Grade' }) {
  // Submitting with no grade shows a validation error (red border on the
  // grade button itself, since that's the control that needs the fix, + a
  // small message above the field) rather than auto-opening the grade
  // dropdown — a more standard form-validation pattern. Clears as soon as a
  // grade is actually picked. shakeKey just bumps on every failed submit so
  // the grade button's wiggle (keyed on it below) remounts and re-fires even
  // if the user hits Search/Enter repeatedly while still gradeless.
  const [showGradeError, setShowGradeError] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)

  function submitOrOpenGrade() {
    if (!grade) {
      setShowGradeError(true)
      setShakeKey((k) => k + 1)
      return
    }
    onSubmit()
  }

  function handleGradeChange(g) {
    setShowGradeError(false)
    onGradeChange(g)
  }

  return (
    <div className={`relative w-full ${maxWidthClassName}`}>
      {showGradeError && (
        <span className="absolute -top-6 right-0 text-xs font-medium text-state-error">Select a grade level</span>
      )}
      <div className="relative flex items-center h-12 w-full rounded-full border border-brand-border bg-white shadow-sm">
        <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitOrOpenGrade()
          }}
          placeholder="Search guides, videos, worksheets..."
          className="w-full h-full pl-12 pr-56 text-sm text-brand-text placeholder:text-brand-subtext bg-transparent rounded-full focus:outline-none"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Popover.Root open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger asChild>
              <motion.button
                key={shakeKey}
                type="button"
                initial={{ x: 0 }}
                animate={showGradeError ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className={`flex items-center gap-1 pl-3.5 pr-2.5 h-8 rounded-full text-xs font-semibold bg-dessa-tealLight text-dessa-teal hover:bg-dessa-teal/20 transition-colors border-[1.5px] ${
                  showGradeError ? 'border-state-error/90' : 'border-transparent'
                }`}
              >
                {grade || gradePlaceholder}
                <ChevronDown size={14} />
              </motion.button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="end"
                sideOffset={8}
                className="z-30 w-56 max-h-72 overflow-y-auto bg-white border border-brand-border rounded-xl shadow-lg outline-none p-1.5"
              >
                {SELECTABLE_GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      handleGradeChange(g)
                      onOpenChange(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      g === grade ? 'bg-dessa-tealLight text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <button
            type="button"
            onClick={submitOrOpenGrade}
            className="shrink-0 h-8 px-4 rounded-full text-xs font-semibold bg-dessa-teal text-white hover:bg-dessa-teal/90 transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  )
}

// "Recently viewed" section on Concept E's landing hero — no view-history is
// actually tracked anywhere in this prototype, so this is a fixed mock set
// (three different types/colors, for visual variety), not wired to real
// browsing state. Modeled on a reference screenshot's bold solid-color card
// treatment — a real departure from this app's usual white-card/thin-border
// convention, used deliberately here rather than toned down, since the
// reference was explicit. Each card's solid fill is that resource's own
// TYPE_META color (not an arbitrary pick), so the color carries meaning.
// Clicking a card is a real destination, not a dead end: it jumps straight
// into that resource's grade results, the same way clicking a grade card
// elsewhere in this file does.
const RECENTLY_VIEWED_TITLES = ['Emotion Check-In Video', 'Community Circle Facilitation Guide', 'Peer Pressure Discussion Cards']

// ── Concept E's own results UI ──
// Resources render as bordered containers (icon thumbnail + title/meta +
// trailing type badge/competency tag) instead of the shared row/card
// components — that part is still forked from C/D. Filtering itself
// (2026-09-16) now reuses the same FilterBarShared component C/D use, per
// manager feedback standardizing on one filter mechanic everywhere; only
// Sort stays as E's own separate pill, since it isn't a filter and
// FilterBarShared has no sort concept.
const SORT_OPTIONS = [
  { value: 'title', label: 'Title (A to Z)' },
  { value: 'grade', label: 'Grade' },
]

function SortByPill({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = SORT_OPTIONS.find((o) => o.value === value)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3.5 h-9 rounded-full text-sm font-medium border border-brand-border bg-white text-brand-text hover:bg-brand-bg transition-colors"
        >
          Sort: {current.label}
          <ChevronDown size={14} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-30 w-48 bg-white border border-brand-border rounded-xl shadow-lg outline-none p-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-lg transition-colors ${
                opt.value === value ? 'bg-dessa-tealLight text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function ResultsDashE({ grade, query }) {
  // Single-select, seeded from whichever grade was picked in the search
  // field's chip — always exactly one value ("All Grades" included), never
  // a combination, same convention as ResultsExperience (C/D) now uses.
  const [selectedGrade, setSelectedGrade] = useState(grade)
  const [courseTypes, setCourseTypes] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [types, setTypes] = useState([])
  const [sortKey, setSortKey] = useState('title')
  const [selected, setSelected] = useState(null)

  function toggle(setFn, current, value) {
    setFn(current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }
  function resetAll() {
    setSelectedGrade('All Grades')
    setCourseTypes([])
    setCompetencies([])
    setTypes([])
  }

  let rows = MOCK_RESOURCES
  if (selectedGrade !== 'All Grades') rows = rows.filter((r) => r.grade === selectedGrade)
  const q = (query || '').trim().toLowerCase()
  if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q))
  if (courseTypes.length) rows = rows.filter((r) => courseTypes.includes(r.courseType))
  if (competencies.length) rows = rows.filter((r) => competencies.includes(r.competency))
  if (types.length) rows = rows.filter((r) => types.includes(r.type))
  rows = [...rows].sort((a, b) => (sortKey === 'grade' ? a.grade.localeCompare(b.grade) : a.title.localeCompare(b.title)))

  return (
    <div className="px-6 pt-6 pb-16">
      <FilterBarShared
        grades={[selectedGrade]}
        courseTypes={courseTypes}
        competencies={competencies}
        types={types}
        onSelectGrade={setSelectedGrade}
        onToggleCourseType={(v) => toggle(setCourseTypes, courseTypes, v)}
        onToggleCompetency={(v) => toggle(setCompetencies, competencies, v)}
        onToggleType={(v) => toggle(setTypes, types, v)}
        onResetAll={resetAll}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-brand-text">Resources</h2>
        <SortByPill value={sortKey} onChange={setSortKey} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-white px-6 py-12 text-center">
          <p className="text-lg font-semibold text-brand-text mb-1.5">No resources found</p>
          <p className="text-sm text-brand-subtext max-w-sm mx-auto">Try adjusting your keywords or clearing the filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => {
            const typeMeta = TYPE_META[r.type]
            return (
              <div
                key={r.title}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(r)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSelected(r)
                }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-brand-border bg-white hover:border-dessa-teal/30 transition-colors cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeMeta.bg}`}>
                  <typeMeta.icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-brand-text truncate">{r.title}</p>
                  <p className="text-sm text-brand-subtext truncate mt-0.5">{r.unit} · {r.grade}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full whitespace-nowrap ${typeMeta.bg} bg-opacity-10 ${typeMeta.color} text-xs font-medium`}>
                    <typeMeta.icon size={12} />
                    {typeMeta.label}
                  </span>
                  <span className="hidden md:inline-flex px-2.5 py-1 rounded-full bg-brand-bg text-brand-text text-xs font-medium max-w-[160px] truncate">
                    {r.competency}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <ResourceDetailModal resource={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

export function ConceptE() {
  // pendingGrade: whatever's currently showing in the field's grade segment
  // (set as soon as it's picked, even before Search is pressed). activeGrade:
  // only set once Search actually succeeds — this is what gates the
  // transition from hero to results, same role gateOpen/selectedGrades plays
  // in the other concepts.
  const [pendingGrade, setPendingGrade] = useState(null)
  const [query, setQuery] = useState('')
  const [gradeOpen, setGradeOpen] = useState(false)
  const [activeGrade, setActiveGrade] = useState(null)
  // Recently Viewed cards simulate re-opening a resource you already
  // visited, not picking a grade — so this just opens the same detail
  // modal search results use, right on top of the hero, instead of routing
  // through the grade gate the way picking a grade from the field does.
  const [selectedRecent, setSelectedRecent] = useState(null)

  function handleSubmit() {
    if (!pendingGrade) {
      setGradeOpen(true)
      return
    }
    setActiveGrade(pendingGrade)
  }

  if (!activeGrade) {
    const recentlyViewed = RECENTLY_VIEWED_TITLES.map((t) => MOCK_RESOURCES.find((r) => r.title === t)).filter(Boolean)
    return (
      <div className="w-screen mx-[calc(50%-50vw)]">
        <div className="bg-brand-bg px-6 pt-20 pb-16 flex flex-col items-center text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-dessa-tealLight text-dessa-teal text-xs font-semibold mb-4">
            Resource Library
          </span>
          <h1 className="text-[38px] font-semibold text-brand-text max-w-2xl mb-4 leading-[1.15]">
            Everything you need to teach, by grade level
          </h1>
          <p className="text-base text-brand-subtext max-w-xl mb-6">
            Lesson videos, worksheets, and guides organized by grade level.
          </p>
          <PairedSearchField
            grade={pendingGrade}
            onGradeChange={setPendingGrade}
            query={query}
            onQueryChange={setQuery}
            open={gradeOpen}
            onOpenChange={setGradeOpen}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="px-6 pt-12 pb-16">
          <p className="text-xs font-semibold text-brand-subtext uppercase tracking-wide mb-4">Recently Viewed</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {recentlyViewed.map((r) => {
              const typeMeta = TYPE_META[r.type]
              return (
                <button
                  key={r.title}
                  type="button"
                  onClick={() => setSelectedRecent(r)}
                  className={`text-left rounded-2xl p-5 h-full flex flex-col justify-between gap-6 ${typeMeta.bg} text-white hover:brightness-110 transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-lg bg-white/20 flex items-center justify-center">
                      <typeMeta.icon size={20} />
                    </div>
                    <ExternalLink size={16} className="text-white/70" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold mb-1.5">{r.title}</p>
                    <p className="text-sm text-white/80 leading-relaxed">{r.desc}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    View again
                    <ArrowRight size={14} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <ResourceDetailModal resource={selectedRecent} onClose={() => setSelectedRecent(null)} />
      </div>
    )
  }

  return (
    <>
      <div className="w-screen mx-[calc(50%-50vw)] bg-brand-bg border-b border-brand-border sticky top-14 z-40">
        <div className="px-6 pt-[1.35rem] pb-4 flex justify-center">
          <PairedSearchField
            grade={pendingGrade}
            onGradeChange={(g) => {
              setPendingGrade(g)
              setActiveGrade(g)
            }}
            query={query}
            onQueryChange={setQuery}
            open={gradeOpen}
            onOpenChange={setGradeOpen}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
      <ResultsDashE key={activeGrade} grade={activeGrade} query={query} />
    </>
  )
}

export const RESOURCES_GRADE_GROUPS = [
  { label: 'Elementary', grades: ELEMENTARY_GROUP },
  { label: 'Middle School', grades: MIDDLE_GROUP },
  { label: 'High School', grades: HIGH_GROUP },
]
