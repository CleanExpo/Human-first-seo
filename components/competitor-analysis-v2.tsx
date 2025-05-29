"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Search, 
  ExternalLink, 
  BarChart3,
  Users,
  Clock
} from "lucide-react"

interface CompetitorData {
  domain: string
  domainAuthority: number
  monthlyTraffic: string
  topKeywords: string[]
  contentGaps: string[]
  backlinks: number
  avgPageSpeed: number
}

interface KeywordData {
  keyword: string
  searchVolume: number
  difficulty: number
  cpc: string
  trend: "up" | "down" | "stable"
  opportunity: "high" | "medium" | "low"
}

interface CompetitorAnalysisProps {
  websiteUrl: string
  targetKeywords: string
  onAnalysisComplete: (data: {
    competitors: CompetitorData[]
    keywords: KeywordData[]
    opportunities: string[]
  }) => void
}

export function CompetitorAnalysisV2({ websiteUrl, targetKeywords, onAnalysisComplete }: CompetitorAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [error, setError] = useState<string | null>(null)

  // Mock keywords data (will be replaced with real API later)
  const mockKeywords: KeywordData[] = [
    {
      keyword: "human-first content",
      searchVolume: 8900,
      difficulty: 35,
      cpc: "$2.40",
      trend: "up",
      opportunity: "high"
    },
    {
      keyword: "authentic content creation",
      searchVolume: 5600,
      difficulty: 28,
      cpc: "$1.80",
      trend: "up", 
      opportunity: "high"
    },
    {
      keyword: "AI content detection",
      searchVolume: 12400,
      difficulty: 45,
      cpc: "$3.20",
      trend: "up",
      opportunity: "medium"
    },
    {
      keyword: "content readability score",
      searchVolume: 3200,
      difficulty: 22,
      cpc: "$1.50",
      trend: "stable",
      opportunity: "high"
    },
    {
      keyword: "SEO content optimization",
      searchVolume: 18700,
      difficulty: 58,
      cpc: "$4.10",
      trend: "stable",
      opportunity: "medium"
    }
  ]

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      // Call real API endpoint
      const response = await fetch('/api/competitor/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl,
          targetKeywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
          analysisDepth: 'detailed'
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        console.log('✅ Real competitor analysis successful:', result.data)
        setCompetitors(result.data.competitors)
        setIsAnalyzing(false)
        setAnalysisComplete(true)
        
        // Pass real analysis data back to parent
        onAnalysisComplete({
          competitors: result.data.competitors,
          keywords: mockKeywords, // Keep mock keywords for now
          opportunities: result.data.opportunities.map((opp: { topic: string }) => opp.topic)
        })
      } else {
        console.error('❌ API Error:', result.error)
        setError(`API Error: ${result.error?.message || 'Unknown error'}`)
        setIsAnalyzing(false)
      }
    } catch (error) {
      console.error('💥 Network Error:', error)
      setError(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsAnalyzing(false)
    }
  }

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case "high": return "bg-green-100 text-green-800 border-green-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-3 w-3 text-green-600" />
      case "down": return <TrendingDown className="h-3 w-3 text-red-600" />
      default: return <BarChart3 className="h-3 w-3 text-gray-600" />
    }
  }

  if (!analysisComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Competitor & Keyword Analysis (AI-Powered)
          </CardTitle>
          <CardDescription>
            Analyze your competition using OpenAI + Claude for enhanced insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p><strong>Target URL:</strong> {websiteUrl || "Not specified"}</p>
              <p><strong>Keywords:</strong> {targetKeywords || "Not specified"}</p>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <strong>Error:</strong> {error}
                <div className="mt-1 text-xs">
                  Make sure your API keys are configured in the environment variables.
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !websiteUrl}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze with OpenAI + Claude
                </>
              )}
            </Button>
            
            {isAnalyzing && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">AI analysis in progress...</div>
                <Progress value={66} className="w-full" />
                <div className="text-xs text-muted-foreground">
                  🤖 OpenAI analyzing competitors → 🧠 Claude enhancing content gaps
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Target className="h-5 w-5" />
            AI Analysis Complete
          </CardTitle>
          <CardDescription>
            Found {competitors.length} competitors with AI-enhanced insights
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="competitors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="space-y-4">
          {competitors.map((competitor, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    {competitor.domain}
                  </span>
                  <div className="flex gap-2">
                    <Badge variant="outline">DA: {competitor.domainAuthority}</Badge>
                    <Badge className="bg-blue-100 text-blue-800">AI Analyzed</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Monthly Traffic
                    </div>
                    <div className="font-semibold">{competitor.monthlyTraffic}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      Backlinks
                    </div>
                    <div className="font-semibold">{competitor.backlinks.toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Page Speed
                    </div>
                    <div className="font-semibold">{competitor.avgPageSpeed}s</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Authority</div>
                    <Progress value={competitor.domainAuthority} className="w-full" />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Top Keywords:</div>
                  <div className="flex flex-wrap gap-1">
                    {competitor.topKeywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">AI-Identified Content Gaps:</div>
                  <div className="flex flex-wrap gap-1">
                    {competitor.contentGaps.map((gap, i) => (
                      <Badge key={i} className="text-xs bg-green-100 text-green-800 border-green-200">
                        {gap}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          {mockKeywords.map((keyword, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-semibold">{keyword.keyword}</div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(keyword.trend)}
                    <Badge className={getOpportunityColor(keyword.opportunity)}>
                      {keyword.opportunity} opportunity
                    </Badge>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Search Volume</div>
                    <div className="font-semibold">{keyword.searchVolume.toLocaleString()}/mo</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Difficulty</div>
                    <div className="flex items-center gap-2">
                      <Progress value={keyword.difficulty} className="flex-1" />
                      <span className="text-sm font-medium">{keyword.difficulty}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">CPC</div>
                    <div className="font-semibold">{keyword.cpc}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Trend</div>
                    <div className="flex items-center gap-1 font-semibold capitalize">
                      {getTrendIcon(keyword.trend)}
                      {keyword.trend}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Enhanced Content Opportunities</CardTitle>
              <CardDescription>
                Multi-LLM analysis identified these high-potential content topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitors.flatMap(c => c.contentGaps).slice(0, 8).map((opportunity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{opportunity}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        High Potential
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        AI Verified
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
