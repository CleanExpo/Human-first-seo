"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScoringDashboard } from "@/components/scoring-dashboard"
import { CompetitorAnalysis } from "@/components/competitor-analysis"
import { calculateReadabilityScore, calculateOriginalityScore, calculateSEOScore } from "@/lib/utils"
import { Search, FileText, Target, CheckCircle, Users, Lightbulb } from "lucide-react"

export default function Home() {
  const [projectData, setProjectData] = useState({
    websiteUrl: "",
    targetKeywords: "",
    title: "",
    metaDescription: "",
    content: "",
    humanInsights: "",
    sources: "",
    internalLinks: 0,
    externalLinks: 0
  })

  const [scores, setScores] = useState({
    readability: 0,
    originality: 0,
    seo: 0,
    factCheck: 0
  })

  const [currentStep, setCurrentStep] = useState("research")

  const updateScores = () => {
    const readabilityScore = calculateReadabilityScore(projectData.content)
    const originalityScore = calculateOriginalityScore(projectData.content)
    const seoScore = calculateSEOScore({
      title: projectData.title,
      metaDescription: projectData.metaDescription,
      headings: [], // Would extract from content in real implementation
      content: projectData.content,
      internalLinks: projectData.internalLinks,
      externalLinks: projectData.externalLinks
    })
    const factCheckScore = projectData.sources.split('\n').filter(s => s.trim()).length * 20 // Simplified

    setScores({
      readability: readabilityScore,
      originality: originalityScore,
      seo: seoScore,
      factCheck: Math.min(100, factCheckScore)
    })
  }

  const handleInputChange = (field: string, value: string | number) => {
    setProjectData(prev => ({ ...prev, [field]: value }))
    // Update scores when content changes
    if (field === 'content' || field === 'title' || field === 'metaDescription') {
      setTimeout(updateScores, 100)
    }
  }

  const workflowSteps = [
    { id: "research", label: "Research & Analysis", icon: Search, description: "Competitor analysis and keyword research" },
    { id: "structure", label: "Content Structure", icon: FileText, description: "Outline and heading structure" },
    { id: "content", label: "Content Creation", icon: Users, description: "Human-first content writing" },
    { id: "optimize", label: "SEO Optimization", icon: Target, description: "Technical SEO and metadata" },
    { id: "review", label: "Quality Review", icon: CheckCircle, description: "Final checks and validation" }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Human-First SEO Creator
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Create authentic, well-researched content that serves users and search engines
          </p>
          
          <ScoringDashboard
            readabilityScore={scores.readability}
            originalityScore={scores.originality}
            seoScore={scores.seo}
            factCheckScore={scores.factCheck}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Workflow Steps Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Workflow
                </CardTitle>
                <CardDescription>
                  Follow the human-first content creation process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {workflowSteps.map((step) => {
                  const Icon = step.icon
                  const isActive = currentStep === step.id
                  const isCompleted = false // Would track completion in real app
                  
                  return (
                    <div
                      key={step.id}
                      className={`workflow-step cursor-pointer transition-colors ${
                        isActive ? 'active' : isCompleted ? 'completed' : 'pending'
                      }`}
                      onClick={() => setCurrentStep(step.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium text-sm">{step.label}</div>
                          <div className="text-xs text-muted-foreground">{step.description}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs value={currentStep} onValueChange={setCurrentStep}>
              <TabsList className="grid w-full grid-cols-5">
                {workflowSteps.map((step) => (
                  <TabsTrigger key={step.id} value={step.id} className="text-xs">
                    {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="research" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Setup & Research</CardTitle>
                    <CardDescription>
                      Start by defining your target and gathering competitive intelligence
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="website-url">Website URL</Label>
                        <Input
                          id="website-url"
                          placeholder="https://yourwebsite.com"
                          value={projectData.websiteUrl}
                          onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-keywords">Target Keywords</Label>
                        <Input
                          id="target-keywords"
                          placeholder="primary keyword, secondary keyword"
                          value={projectData.targetKeywords}
                          onChange={(e) => handleInputChange('targetKeywords', e.target.value)}
                        />
                      </div>
                    </div>
                    <CompetitorAnalysis
                      websiteUrl={projectData.websiteUrl}
                      targetKeywords={projectData.targetKeywords}
                      onAnalysisComplete={(data) => {
                        // Handle analysis completion
                        console.log('Analysis complete:', data)
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="structure" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Structure & Outline</CardTitle>
                    <CardDescription>
                      Create a logical, SEO-optimized content structure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Page Title (H1)</Label>
                      <Input
                        id="title"
                        placeholder="Your compelling, keyword-rich title"
                        value={projectData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {projectData.title.length}/60 characters (optimal: 30-60)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta-description">Meta Description</Label>
                      <Textarea
                        id="meta-description"
                        placeholder="A compelling description that encourages clicks"
                        value={projectData.metaDescription}
                        onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        {projectData.metaDescription.length}/155 characters (optimal: 120-155)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Human-First Content Creation</CardTitle>
                    <CardDescription>
                      Write authentic, valuable content with personal insights and experiences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="human-insights">Human Insights & Personal Experience</Label>
                      <Textarea
                        id="human-insights"
                        placeholder="Share your personal experiences, unique insights, expert opinions, or case studies that only you can provide..."
                        value={projectData.humanInsights}
                        onChange={(e) => handleInputChange('humanInsights', e.target.value)}
                        rows={4}
                        className="content-editor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="main-content">Main Content</Label>
                      <Textarea
                        id="main-content"
                        placeholder="Write your main content here. Focus on clarity, simplicity, and value for your readers..."
                        value={projectData.content}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        rows={12}
                        className="content-editor"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{projectData.content.split(/\s+/).filter(w => w.length > 0).length} words</span>
                        <span>Reading Level: {scores.readability.toFixed(1)} grade</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sources">Sources & References</Label>
                      <Textarea
                        id="sources"
                        placeholder="List your sources, one per line:&#10;https://authoritative-source.com&#10;https://research-study.edu&#10;Expert Name - Personal Communication"
                        value={projectData.sources}
                        onChange={(e) => handleInputChange('sources', e.target.value)}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="optimize" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Optimization</CardTitle>
                    <CardDescription>
                      Fine-tune technical SEO elements and link structure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="internal-links">Internal Links Count</Label>
                        <Input
                          id="internal-links"
                          type="number"
                          min="0"
                          value={projectData.internalLinks}
                          onChange={(e) => handleInputChange('internalLinks', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="external-links">External Links Count</Label>
                        <Input
                          id="external-links"
                          type="number"
                          min="0"
                          value={projectData.externalLinks}
                          onChange={(e) => handleInputChange('externalLinks', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <Button onClick={updateScores} className="w-full">
                      <Target className="mr-2 h-4 w-4" />
                      Analyze SEO Performance
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="review" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Review & Publishing</CardTitle>
                    <CardDescription>
                      Final checks before publishing your human-first content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Content Quality Checklist</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Includes personal insights and experiences</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>All facts are properly sourced</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Reading level is appropriate (4th-6th grade)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Content serves user intent</span>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full" size="lg">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Publish Human-Certified Content
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
