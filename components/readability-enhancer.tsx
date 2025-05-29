"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { 
  Brain, 
  Target, 
  Lightbulb, 
  Users, 
  BookOpen,
  Zap,
  RefreshCw,
  TrendingUp,
  Heart,
  MessageCircle
} from "lucide-react"

interface ReadabilityEnhancerProps {
  content: string
  targetGradeLevel: number
  onContentUpdate: (newContent: string) => void
  onTargetLevelChange: (level: number) => void
}

interface ReadabilityMetrics {
  currentGradeLevel: number
  fleschScore: number
  avgSentenceLength: number
  complexWords: number
  humanMarkers: number
  personalTone: number
}

interface EnhancementSuggestion {
  type: 'simplify' | 'humanize' | 'personal' | 'structure'
  original: string
  improved: string
  reason: string
  impact: 'high' | 'medium' | 'low'
}

export function ReadabilityEnhancer({ 
  content, 
  targetGradeLevel, 
  onContentUpdate, 
  onTargetLevelChange 
}: ReadabilityEnhancerProps) {
  const [metrics, setMetrics] = useState<ReadabilityMetrics>({
    currentGradeLevel: 12,
    fleschScore: 0,
    avgSentenceLength: 0,
    complexWords: 0,
    humanMarkers: 0,
    personalTone: 0
  })
  
  const [suggestions, setSuggestions] = useState<EnhancementSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementMode, setEnhancementMode] = useState<'readability' | 'human' | 'personal'>('readability')

  // Analyze content when it changes
  useEffect(() => {
    if (content.length > 10) {
      analyzeReadability()
    }
  }, [content])

  const analyzeReadability = () => {
    // Calculate readability metrics
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((total, word) => total + countSyllables(word), 0)
    
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0
    const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0
    
    // Flesch Reading Ease Score
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
    
    // Grade level calculation
    const gradeLevel = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59
    
    // Count complex words (3+ syllables)
    const complexWords = words.filter(word => countSyllables(word) >= 3).length
    
    // Count human markers
    const humanMarkers = countHumanMarkers(content)
    
    // Personal tone score
    const personalTone = calculatePersonalTone(content)
    
    setMetrics({
      currentGradeLevel: Math.max(1, Math.round(gradeLevel)),
      fleschScore: Math.max(0, Math.min(100, fleschScore)),
      avgSentenceLength,
      complexWords,
      humanMarkers,
      personalTone
    })
    
    // Generate suggestions
    generateSuggestions()
  }

  const countSyllables = (word: string): number => {
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
    
    if (word.endsWith('e') && syllables > 1) {
      syllables--
    }
    
    return Math.max(1, syllables)
  }

  const countHumanMarkers = (text: string): number => {
    const markers = [
      /\bi\s/gi, /\bmy\s/gi, /\bme\s/gi, /\bour\s/gi, /\bwe\s/gi,
      /in my experience/gi, /i found/gi, /i discovered/gi, /i learned/gi,
      /personally/gi, /from my perspective/gi, /i think/gi, /i believe/gi
    ]
    
    return markers.reduce((count, pattern) => {
      const matches = text.match(pattern)
      return count + (matches ? matches.length : 0)
    }, 0)
  }

  const calculatePersonalTone = (text: string): number => {
    const personalIndicators = [
      /\bi\s/gi, /\bmy\s/gi, /personally/gi, /in my opinion/gi,
      /from my experience/gi, /i've found/gi, /i recommend/gi
    ]
    
    const emotionalWords = [
      /excited/gi, /frustrated/gi, /surprised/gi, /disappointed/gi,
      /thrilled/gi, /concerned/gi, /worried/gi, /happy/gi
    ]
    
    let score = 0
    personalIndicators.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) score += matches.length * 10
    })
    
    emotionalWords.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) score += matches.length * 5
    })
    
    return Math.min(100, score)
  }

  const generateSuggestions = () => {
    const newSuggestions: EnhancementSuggestion[] = []
    
    // Readability suggestions
    if (metrics.currentGradeLevel > targetGradeLevel) {
      newSuggestions.push({
        type: 'simplify',
        original: 'Complex sentences detected',
        improved: 'Break long sentences into shorter ones',
        reason: `Current grade level (${metrics.currentGradeLevel}) is above target (${targetGradeLevel})`,
        impact: 'high'
      })
    }
    
    if (metrics.complexWords > content.split(/\s+/).length * 0.1) {
      newSuggestions.push({
        type: 'simplify',
        original: 'Too many complex words',
        improved: 'Replace complex words with simpler alternatives',
        reason: `${metrics.complexWords} complex words found`,
        impact: 'medium'
      })
    }
    
    // Human tone suggestions
    if (metrics.humanMarkers < 3) {
      newSuggestions.push({
        type: 'humanize',
        original: 'Content lacks personal touch',
        improved: 'Add personal pronouns and experiences',
        reason: `Only ${metrics.humanMarkers} human markers found`,
        impact: 'high'
      })
    }
    
    if (metrics.personalTone < 30) {
      newSuggestions.push({
        type: 'personal',
        original: 'Tone is too formal',
        improved: 'Add personal experiences and opinions',
        reason: `Personal tone score: ${metrics.personalTone}%`,
        impact: 'medium'
      })
    }
    
    setSuggestions(newSuggestions)
  }

  const enhanceContent = async (mode: 'readability' | 'human' | 'personal') => {
    setIsEnhancing(true)
    setEnhancementMode(mode)
    
    try {
      let prompt = ''
      
      switch (mode) {
        case 'readability':
          prompt = `Rewrite this content to be at a ${targetGradeLevel}th grade reading level. Make sentences shorter and use simpler words while keeping the meaning intact:\n\n${content}`
          break
        case 'human':
          prompt = `Rewrite this content to sound more human and authentic. Add personal touches, use "I" statements, and make it conversational while keeping the information accurate:\n\n${content}`
          break
        case 'personal':
          prompt = `Enhance this content by adding personal experiences, opinions, and insights. Make it sound like it's written by someone with real experience in the topic:\n\n${content}`
          break
      }
      
      // Call the LLM router for content enhancement
      const response = await fetch('/api/content/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          mode,
          targetGradeLevel,
          prompt
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.enhancedContent) {
          onContentUpdate(result.enhancedContent)
        }
      }
    } catch (error) {
      console.error('Enhancement failed:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const getGradeLevelColor = (level: number) => {
    if (level <= 6) return "text-green-600"
    if (level <= 8) return "text-yellow-600"
    if (level <= 10) return "text-orange-600"
    return "text-red-600"
  }

  const getGradeLevelStatus = (current: number, target: number) => {
    if (current <= target) return { status: "On Target", color: "bg-green-100 text-green-800" }
    if (current <= target + 2) return { status: "Close", color: "bg-yellow-100 text-yellow-800" }
    return { status: "Too Complex", color: "bg-red-100 text-red-800" }
  }

  const gradeLevelStatus = getGradeLevelStatus(metrics.currentGradeLevel, targetGradeLevel)

  return (
    <div className="space-y-4">
      {/* Readability Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Readability Enhancement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Grade Level Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Target Reading Level</label>
              <Badge variant="outline">{targetGradeLevel}th Grade</Badge>
            </div>
            <Slider
              value={[targetGradeLevel]}
              onValueChange={(value: number[]) => onTargetLevelChange(value[0])}
              min={4}
              max={12}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>4th Grade (Simple)</span>
              <span>8th Grade (Standard)</span>
              <span>12th Grade (Complex)</span>
            </div>
          </div>

          {/* Current Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getGradeLevelColor(metrics.currentGradeLevel)}`}>
                {metrics.currentGradeLevel}
              </div>
              <div className="text-xs text-muted-foreground">Current Level</div>
              <Badge className={gradeLevelStatus.color} variant="outline">
                {gradeLevelStatus.status}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.fleschScore.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Flesch Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.humanMarkers}
              </div>
              <div className="text-xs text-muted-foreground">Human Markers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {metrics.personalTone}%
              </div>
              <div className="text-xs text-muted-foreground">Personal Tone</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhancement Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Target className="h-5 w-5 text-blue-600" />
              <div className="font-medium">Simplify Reading</div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Make content easier to read by simplifying sentences and vocabulary
            </p>
            <Button 
              onClick={() => enhanceContent('readability')}
              disabled={isEnhancing}
              className="w-full"
              variant="outline"
            >
              {isEnhancing && enhancementMode === 'readability' ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Target className="h-4 w-4 mr-2" />
              )}
              Simplify Content
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-5 w-5 text-green-600" />
              <div className="font-medium">Humanize Tone</div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Add human touches, personal pronouns, and conversational elements
            </p>
            <Button 
              onClick={() => enhanceContent('human')}
              disabled={isEnhancing}
              className="w-full"
              variant="outline"
            >
              {isEnhancing && enhancementMode === 'human' ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Humanize Content
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="h-5 w-5 text-pink-600" />
              <div className="font-medium">Add Personal Touch</div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Include personal experiences, opinions, and authentic insights
            </p>
            <Button 
              onClick={() => enhanceContent('personal')}
              disabled={isEnhancing}
              className="w-full"
              variant="outline"
            >
              {isEnhancing && enhancementMode === 'personal' ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Heart className="h-4 w-4 mr-2" />
              )}
              Personalize Content
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Enhancement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {suggestion.type === 'simplify' && <Target className="h-4 w-4 text-blue-600" />}
                      {suggestion.type === 'humanize' && <Brain className="h-4 w-4 text-green-600" />}
                      {suggestion.type === 'personal' && <Heart className="h-4 w-4 text-pink-600" />}
                      <span className="font-medium text-sm">{suggestion.improved}</span>
                    </div>
                    <Badge variant="outline" className={
                      suggestion.impact === 'high' ? 'text-red-600' :
                      suggestion.impact === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }>
                      {suggestion.impact} impact
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhancement Status */}
      {isEnhancing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  Enhancing Content for {enhancementMode === 'readability' ? 'Readability' : 
                                       enhancementMode === 'human' ? 'Human Tone' : 'Personal Touch'}
                </div>
                <div className="text-sm text-blue-700">
                  Using AI to improve your content while maintaining accuracy...
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
