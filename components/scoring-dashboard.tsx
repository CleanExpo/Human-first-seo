"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, XCircle, Target } from "lucide-react"

interface ScoringDashboardProps {
  readabilityScore: number
  originalityScore: number
  seoScore: number
  factCheckScore: number
}

export function ScoringDashboard({
  readabilityScore,
  originalityScore,
  seoScore,
  factCheckScore
}: ScoringDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "score-excellent"
    if (score >= 60) return "score-good"
    if (score >= 40) return "score-warning"
    return "score-poor"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />
    if (score >= 60) return <Target className="h-4 w-4" />
    if (score >= 40) return <AlertCircle className="h-4 w-4" />
    return <XCircle className="h-4 w-4" />
  }

  const getReadabilityGrade = (score: number) => {
    if (score <= 4) return { grade: "4th Grade", status: "excellent" }
    if (score <= 6) return { grade: "6th Grade", status: "good" }
    if (score <= 8) return { grade: "8th Grade", status: "warning" }
    return { grade: "College+", status: "poor" }
  }

  const readabilityGrade = getReadabilityGrade(readabilityScore)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Readability</CardTitle>
          {getScoreIcon(readabilityScore <= 4 ? 100 : readabilityScore <= 6 ? 80 : readabilityScore <= 8 ? 60 : 40)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{readabilityGrade.grade}</div>
          <p className="text-xs text-muted-foreground">
            Grade Level: {readabilityScore.toFixed(1)}
          </p>
          <div className="mt-2">
            <Badge 
              variant="outline" 
              className={`readability-grade ${
                readabilityGrade.status === 'excellent' ? 'score-excellent' :
                readabilityGrade.status === 'good' ? 'score-good' :
                readabilityGrade.status === 'warning' ? 'score-warning' : 'score-poor'
              }`}
            >
              {readabilityGrade.status === 'excellent' ? 'Perfect' :
               readabilityGrade.status === 'good' ? 'Good' :
               readabilityGrade.status === 'warning' ? 'Needs Work' : 'Too Complex'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Originality</CardTitle>
          {getScoreIcon(originalityScore)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{originalityScore}%</div>
          <p className="text-xs text-muted-foreground">
            Human-authored content
          </p>
          <Progress value={originalityScore} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SEO Score</CardTitle>
          {getScoreIcon(seoScore)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{seoScore}%</div>
          <p className="text-xs text-muted-foreground">
            Search optimization
          </p>
          <Progress value={seoScore} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fact Check</CardTitle>
          {getScoreIcon(factCheckScore)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{factCheckScore}%</div>
          <p className="text-xs text-muted-foreground">
            Sources verified
          </p>
          <Progress value={factCheckScore} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  )
}
