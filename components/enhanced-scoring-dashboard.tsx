"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Target, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Eye,
  Brain,
  Search,
  FileCheck,
  Lightbulb,
  Clock
} from "lucide-react"

interface EnhancedScoringDashboardProps {
  projectData: {
    title: string
    metaDescription: string
    content: string
    humanInsights: string
    sources: string
    targetKeywords: string
  }
  onAnalysisUpdate?: (scores: any) => void
}

interface DetailedScores {
  overall: number
  readability: {
    score: number
    gradeLevel: number
    fleschScore: number
    suggestions: string[]
    trend: 'up' | 'down' | 'stable'
  }
  seo: {
    score: number
    titleScore: number
    metaScore: number
    keywordDensity: number
    suggestions: string[]
    trend: 'up' | 'down' | 'stable'
  }
  originality: {
    score: number
    humanMarkers: number
    personalExperience: number
    suggestions: string[]
    trend: 'up' | 'down' | 'stable'
  }
  factCheck: {
    score: number
    sourcesCount: number
    credibilityScore: number
    suggestions: string[]
    trend: 'up' | 'down' | 'stable'
  }
}

export function EnhancedScoringDashboard({ projectData, onAnalysisUpdate }: EnhancedScoringDashboardProps) {
  const [scores, setScores] = useState<DetailedScores>({
    overall: 0,
    readability: { score: 0, gradeLevel: 12, fleschScore: 0, suggestions: [], trend: 'stable' },
    seo: { score: 0, titleScore: 0, metaScore: 0, keywordDensity: 0, suggestions: [], trend: 'stable' },
    originality: { score: 0, humanMarkers: 0, personalExperience: 0, suggestions: [], trend: 'stable' },
    factCheck: { score: 0, sourcesCount: 0, credibilityScore: 0, suggestions: [], trend: 'stable' }
  })
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [animatingScores, setAnimatingScores] = useState<string[]>([])

  // Auto-analyze when content changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (projectData.content.length > 50) {
        analyzeContent()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [projectData.content, projectData.title, projectData.metaDescription])

  const analyzeContent = async () => {
    if (!projectData.content || projectData.content.length < 10) return

    setIsAnalyzing(true)
    
    try {
      // Call the real content analysis API
      const response = await fetch('/api/content/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectData.title,
          metaDescription: projectData.metaDescription,
          content: projectData.content,
          targetKeywords: projectData.targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
          humanInsights: projectData.humanInsights,
          sources: projectData.sources.split('\n').filter(s => s.trim())
        })
      })

      const result = await response.json()

      if (result.success && result.data) {
        const newScores = transformAPIResponse(result.data)
        
        // Animate score changes
        const changedCategories = detectScoreChanges(scores, newScores)
        setAnimatingScores(changedCategories)
        
        setScores(newScores)
        setLastAnalyzed(new Date())
        
        // Clear animations after delay
        setTimeout(() => setAnimatingScores([]), 1000)
        
        // Notify parent component
        onAnalysisUpdate?.(newScores)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const transformAPIResponse = (apiData: any): DetailedScores => {
    return {
      overall: apiData.scores?.overall || 0,
      readability: {
        score: apiData.scores?.readability || 0,
        gradeLevel: apiData.readabilityAnalysis?.gradeLevel || 12,
        fleschScore: apiData.readabilityAnalysis?.fleschScore || 0,
        suggestions: apiData.readabilityAnalysis?.suggestions || [],
        trend: 'stable'
      },
      seo: {
        score: apiData.scores?.seo || 0,
        titleScore: apiData.seoAnalysis?.titleOptimization?.score || 0,
        metaScore: apiData.seoAnalysis?.metaDescription?.score || 0,
        keywordDensity: apiData.seoAnalysis?.keywordOptimization?.density || 0,
        suggestions: apiData.seoAnalysis?.titleOptimization?.suggestions || [],
        trend: 'stable'
      },
      originality: {
        score: apiData.scores?.originality || 0,
        humanMarkers: apiData.originalityAnalysis?.humanMarkers?.length || 0,
        personalExperience: apiData.scores?.humanAuthenticity || 0,
        suggestions: apiData.originalityAnalysis?.suggestions || [],
        trend: 'stable'
      },
      factCheck: {
        score: apiData.scores?.factCheck || 0,
        sourcesCount: apiData.factCheckAnalysis?.sourcesProvided || 0,
        credibilityScore: apiData.factCheckAnalysis?.sourceQuality || 0,
        suggestions: apiData.factCheckAnalysis?.suggestions || [],
        trend: 'stable'
      }
    }
  }

  const detectScoreChanges = (oldScores: DetailedScores, newScores: DetailedScores): string[] => {
    const changes = []
    if (Math.abs(oldScores.readability.score - newScores.readability.score) > 5) changes.push('readability')
    if (Math.abs(oldScores.seo.score - newScores.seo.score) > 5) changes.push('seo')
    if (Math.abs(oldScores.originality.score - newScores.originality.score) > 5) changes.push('originality')
    if (Math.abs(oldScores.factCheck.score - newScores.factCheck.score) > 5) changes.push('factCheck')
    return changes
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score >= 60) return <Target className="h-4 w-4 text-yellow-600" />
    if (score >= 40) return <AlertCircle className="h-4 w-4 text-orange-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />
      default: return null
    }
  }

  const getReadabilityGrade = (gradeLevel: number) => {
    if (gradeLevel <= 6) return { grade: `${gradeLevel}th Grade`, status: "excellent", color: "text-green-600" }
    if (gradeLevel <= 8) return { grade: `${gradeLevel}th Grade`, status: "good", color: "text-yellow-600" }
    if (gradeLevel <= 10) return { grade: `${gradeLevel}th Grade`, status: "warning", color: "text-orange-600" }
    return { grade: "College+", status: "complex", color: "text-red-600" }
  }

  const ScoreCard = ({ 
    title, 
    icon: Icon, 
    score, 
    trend, 
    subtitle, 
    details, 
    suggestions,
    cardKey 
  }: {
    title: string
    icon: any
    score: number
    trend: 'up' | 'down' | 'stable'
    subtitle: string
    details: React.ReactNode
    suggestions: string[]
    cardKey: string
  }) => {
    const isExpanded = expandedCard === cardKey
    const isAnimating = animatingScores.includes(cardKey)

    return (
      <Card className={`transition-all duration-300 hover:shadow-lg cursor-pointer ${
        isAnimating ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}>
        <CardHeader 
          className="flex flex-row items-center justify-between space-y-0 pb-2"
          onClick={() => setExpandedCard(isExpanded ? null : cardKey)}
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {getTrendIcon(trend)}
            {getScoreIcon(score)}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold transition-all duration-500 ${
            isAnimating ? 'scale-110' : ''
          } ${getScoreColor(score)}`}>
            {score}%
          </div>
          <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
          
          <Progress 
            value={score} 
            className={`transition-all duration-700 ${isAnimating ? 'animate-pulse' : ''}`} 
          />
          
          {details}
          
          {isExpanded && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <div className="text-sm font-medium">Suggestions:</div>
              <div className="space-y-1">
                {suggestions.slice(0, 3).map((suggestion, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                    {suggestion}
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implement detailed analysis view
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View Detailed Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const readabilityGrade = getReadabilityGrade(scores.readability.gradeLevel)

  return (
    <div className="space-y-4">
      {/* Overall Score & Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Content Analysis Score</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className={`text-3xl font-bold ${getScoreColor(scores.overall)}`}>
                  {scores.overall}%
                </div>
                {lastAnalyzed && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last analyzed: {lastAnalyzed.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={analyzeContent} 
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Score Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          title="Readability"
          icon={Eye}
          score={scores.readability.score}
          trend={scores.readability.trend}
          subtitle={`${readabilityGrade.grade} • Flesch: ${scores.readability.fleschScore.toFixed(0)}`}
          details={
            <div className="mt-2">
              <Badge variant="outline" className={readabilityGrade.color}>
                {readabilityGrade.status}
              </Badge>
            </div>
          }
          suggestions={scores.readability.suggestions}
          cardKey="readability"
        />

        <ScoreCard
          title="SEO Optimization"
          icon={Search}
          score={scores.seo.score}
          trend={scores.seo.trend}
          subtitle={`Title: ${scores.seo.titleScore}% • Meta: ${scores.seo.metaScore}%`}
          details={
            <div className="mt-2 text-xs text-muted-foreground">
              Keyword density: {scores.seo.keywordDensity.toFixed(1)}%
            </div>
          }
          suggestions={scores.seo.suggestions}
          cardKey="seo"
        />

        <ScoreCard
          title="Human Authenticity"
          icon={Brain}
          score={scores.originality.score}
          trend={scores.originality.trend}
          subtitle={`${scores.originality.humanMarkers} human markers found`}
          details={
            <div className="mt-2 text-xs text-muted-foreground">
              Personal experience: {scores.originality.personalExperience}%
            </div>
          }
          suggestions={scores.originality.suggestions}
          cardKey="originality"
        />

        <ScoreCard
          title="Fact Verification"
          icon={FileCheck}
          score={scores.factCheck.score}
          trend={scores.factCheck.trend}
          subtitle={`${scores.factCheck.sourcesCount} sources • ${scores.factCheck.credibilityScore}% credible`}
          details={
            <div className="mt-2">
              <Badge variant="outline" className={
                scores.factCheck.sourcesCount >= 3 ? "text-green-600" : "text-orange-600"
              }>
                {scores.factCheck.sourcesCount >= 3 ? "Well-sourced" : "Needs sources"}
              </Badge>
            </div>
          }
          suggestions={scores.factCheck.suggestions}
          cardKey="factCheck"
        />
      </div>

      {/* Analysis Status */}
      {isAnalyzing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">AI Analysis in Progress</div>
                <div className="text-sm text-blue-700">
                  Using Claude for readability • OpenAI for SEO • Gemini for fact-checking
                </div>
              </div>
            </div>
            <Progress value={66} className="mt-3" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
