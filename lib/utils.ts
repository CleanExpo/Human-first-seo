import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Content scoring utilities for Human-First SEO

export function calculateReadabilityScore(content: string): number {
  if (!content || content.trim().length === 0) return 0
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = content.split(/\s+/).filter(w => w.length > 0)
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0)
  
  if (sentences.length === 0 || words.length === 0) return 0
  
  const avgSentenceLength = words.length / sentences.length
  const avgSyllablesPerWord = syllables / words.length
  
  // Flesch Reading Ease Score
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  
  // Convert to 0-100 scale where higher is better
  return Math.max(0, Math.min(100, fleschScore))
}

export function calculateOriginalityScore(content: string): number {
  if (!content || content.trim().length === 0) return 0
  
  let score = 50 // Base score
  
  // Check for personal indicators
  const personalIndicators = [
    /\bi\s/gi, /\bmy\s/gi, /\bme\s/gi, /\bour\s/gi, /\bwe\s/gi,
    /in my experience/gi, /i found/gi, /i discovered/gi, /i learned/gi,
    /personally/gi, /from my perspective/gi
  ]
  
  personalIndicators.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      score += Math.min(10, matches.length * 2)
    }
  })
  
  // Check for specific examples and numbers
  const specificityIndicators = [
    /\d+%/g, /\$\d+/g, /\d+\s*(years?|months?|days?)/gi,
    /for example/gi, /specifically/gi, /in particular/gi
  ]
  
  specificityIndicators.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      score += Math.min(15, matches.length * 3)
    }
  })
  
  // Penalize generic phrases
  const genericPhrases = [
    /it is important to note/gi, /it should be noted/gi,
    /in conclusion/gi, /to summarize/gi, /in summary/gi
  ]
  
  genericPhrases.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      score -= matches.length * 5
    }
  })
  
  return Math.max(0, Math.min(100, score))
}

interface SEOData {
  title: string
  metaDescription: string
  headings: string[]
  content: string
  internalLinks: number
  externalLinks: number
}

export function calculateSEOScore(data: SEOData): number {
  let score = 0
  let maxScore = 0
  
  // Title optimization (20 points)
  maxScore += 20
  if (data.title.length >= 30 && data.title.length <= 60) {
    score += 15
  } else if (data.title.length > 0) {
    score += 8
  }
  if (data.title.length > 0) {
    score += 5 // Has title
  }
  
  // Meta description (15 points)
  maxScore += 15
  if (data.metaDescription.length >= 120 && data.metaDescription.length <= 155) {
    score += 15
  } else if (data.metaDescription.length > 0) {
    score += 8
  }
  
  // Content length (20 points)
  maxScore += 20
  const wordCount = data.content.split(/\s+/).filter(w => w.length > 0).length
  if (wordCount >= 300) {
    score += 20
  } else if (wordCount >= 150) {
    score += 12
  } else if (wordCount > 0) {
    score += 5
  }
  
  // Internal links (15 points)
  maxScore += 15
  if (data.internalLinks >= 3) {
    score += 15
  } else if (data.internalLinks >= 1) {
    score += 10
  }
  
  // External links (10 points)
  maxScore += 10
  if (data.externalLinks >= 2) {
    score += 10
  } else if (data.externalLinks >= 1) {
    score += 6
  }
  
  // Headings structure (20 points)
  maxScore += 20
  if (data.headings.length >= 3) {
    score += 20
  } else if (data.headings.length >= 1) {
    score += 12
  }
  
  return Math.round((score / maxScore) * 100)
}

// Helper function to count syllables in a word
function countSyllables(word: string): number {
  if (!word) return 0
  
  word = word.toLowerCase()
  let syllables = 0
  const vowels = 'aeiouy'
  let previousWasVowel = false
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i])
    if (isVowel && !previousWasVowel) {
      syllables++
    }
    previousWasVowel = isVowel
  }
  
  // Handle silent 'e'
  if (word.endsWith('e') && syllables > 1) {
    syllables--
  }
  
  return Math.max(1, syllables)
}
