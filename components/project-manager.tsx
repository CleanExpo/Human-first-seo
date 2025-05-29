"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Clock, 
  FileText, 
  Download, 
  Upload,
  Plus,
  Search,
  Star,
  RotateCcw
} from "lucide-react"

interface ProjectData {
  id: string
  name: string
  websiteUrl: string
  targetKeywords: string
  title: string
  metaDescription: string
  content: string
  humanInsights: string
  sources: string
  targetGradeLevel: number
  lastModified: Date
  wordCount: number
  scores?: {
    overall: number
    readability: number
    seo: number
    originality: number
    factCheck: number
  }
}

interface ProjectManagerProps {
  currentProject: Omit<ProjectData, 'id' | 'name' | 'lastModified' | 'wordCount'>
  onProjectLoad: (project: ProjectData) => void
  onAutoSave?: (project: ProjectData) => void
}

export function ProjectManager({ currentProject, onProjectLoad, onAutoSave }: ProjectManagerProps) {
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([])
  const [projectName, setProjectName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Load saved projects from localStorage on mount
  useEffect(() => {
    loadSavedProjects()
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (isAutoSaveEnabled && currentProject.content.length > 50) {
      const timer = setTimeout(() => {
        autoSaveProject()
      }, 30000) // Auto-save every 30 seconds

      return () => clearTimeout(timer)
    }
  }, [currentProject, isAutoSaveEnabled])

  // Track unsaved changes
  useEffect(() => {
    setUnsavedChanges(true)
  }, [currentProject])

  const loadSavedProjects = () => {
    try {
      const saved = localStorage.getItem('human-first-seo-projects')
      if (saved) {
        const projects = JSON.parse(saved).map((p: any) => ({
          ...p,
          lastModified: new Date(p.lastModified)
        }))
        setSavedProjects(projects)
      }
    } catch (error) {
      console.error('Failed to load saved projects:', error)
    }
  }

  const saveProjectsToStorage = (projects: ProjectData[]) => {
    try {
      localStorage.setItem('human-first-seo-projects', JSON.stringify(projects))
    } catch (error) {
      console.error('Failed to save projects:', error)
    }
  }

  const generateProjectId = () => {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const calculateWordCount = (content: string) => {
    return content.split(/\s+/).filter(word => word.length > 0).length
  }

  const saveProject = (name?: string) => {
    const projectToSave: ProjectData = {
      id: generateProjectId(),
      name: name || projectName || `Project ${new Date().toLocaleDateString()}`,
      ...currentProject,
      lastModified: new Date(),
      wordCount: calculateWordCount(currentProject.content)
    }

    const updatedProjects = [projectToSave, ...savedProjects]
    setSavedProjects(updatedProjects)
    saveProjectsToStorage(updatedProjects)
    setProjectName('')
    setUnsavedChanges(false)
    
    console.log('✅ Project saved:', projectToSave.name)
  }

  const autoSaveProject = () => {
    if (currentProject.content.length < 50) return

    const autoSaveProject: ProjectData = {
      id: 'autosave',
      name: '🔄 Auto-saved Project',
      ...currentProject,
      lastModified: new Date(),
      wordCount: calculateWordCount(currentProject.content)
    }

    // Remove existing autosave and add new one
    const updatedProjects = [
      autoSaveProject,
      ...savedProjects.filter(p => p.id !== 'autosave')
    ]
    
    setSavedProjects(updatedProjects)
    saveProjectsToStorage(updatedProjects)
    setLastAutoSave(new Date())
    setUnsavedChanges(false)
    
    if (onAutoSave) {
      onAutoSave(autoSaveProject)
    }
  }

  const loadProject = (project: ProjectData) => {
    onProjectLoad(project)
    setUnsavedChanges(false)
    console.log('📂 Project loaded:', project.name)
  }

  const deleteProject = (projectId: string) => {
    const updatedProjects = savedProjects.filter(p => p.id !== projectId)
    setSavedProjects(updatedProjects)
    saveProjectsToStorage(updatedProjects)
    console.log('🗑️ Project deleted')
  }

  const exportProject = (project: ProjectData) => {
    const dataStr = JSON.stringify(project, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const importProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string)
        const importedProject: ProjectData = {
          ...projectData,
          id: generateProjectId(),
          name: `${projectData.name} (Imported)`,
          lastModified: new Date()
        }
        
        const updatedProjects = [importedProject, ...savedProjects]
        setSavedProjects(updatedProjects)
        saveProjectsToStorage(updatedProjects)
        
        console.log('📥 Project imported:', importedProject.name)
      } catch (error) {
        console.error('Failed to import project:', error)
      }
    }
    reader.readAsText(file)
  }

  const filteredProjects = savedProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.websiteUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.targetKeywords.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getProjectStatusColor = (project: ProjectData) => {
    if (project.id === 'autosave') return 'bg-blue-100 text-blue-800'
    if (project.scores?.overall && project.scores.overall >= 80) return 'bg-green-100 text-green-800'
    if (project.scores?.overall && project.scores.overall >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-4">
      {/* Save Current Project */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Project Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Save Controls */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => saveProject()}
              disabled={!currentProject.content || currentProject.content.length < 10}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Project
            </Button>
          </div>

          {/* Auto-save Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAutoSaveEnabled}
                onChange={(e) => setIsAutoSaveEnabled(e.target.checked)}
                className="rounded"
              />
              <span>Auto-save enabled</span>
              {unsavedChanges && (
                <Badge variant="outline" className="text-orange-600">
                  Unsaved changes
                </Badge>
              )}
            </div>
            {lastAutoSave && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last saved: {lastAutoSave.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Import/Export */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => document.getElementById('import-file')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import Project
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={importProject}
              className="hidden"
            />
            {currentProject.content && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportProject({
                  id: 'current',
                  name: projectName || 'Current Project',
                  ...currentProject,
                  lastModified: new Date(),
                  wordCount: calculateWordCount(currentProject.content)
                })}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Current
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saved Projects */}
      {savedProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Saved Projects ({savedProjects.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProjects.map((project) => (
                <div key={project.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <Badge className={getProjectStatusColor(project)} variant="outline">
                          {project.id === 'autosave' ? 'Auto-saved' : 
                           project.scores?.overall ? `${project.scores.overall}% score` : 'Draft'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        {project.websiteUrl && (
                          <div>🌐 {project.websiteUrl}</div>
                        )}
                        {project.targetKeywords && (
                          <div>🎯 {project.targetKeywords}</div>
                        )}
                        <div className="flex items-center gap-4">
                          <span>📝 {project.wordCount} words</span>
                          <span>📅 {project.lastModified.toLocaleDateString()}</span>
                          <span>🎓 Grade {project.targetGradeLevel}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadProject(project)}
                      >
                        <FolderOpen className="h-3 w-3 mr-1" />
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportProject(project)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      {project.id !== 'autosave' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProject(project.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => saveProject('Quick Save')}>
              <Save className="h-4 w-4 mr-2" />
              Quick Save
            </Button>
            <Button variant="outline" size="sm" onClick={autoSaveProject}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Manual Backup
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const autosave = savedProjects.find(p => p.id === 'autosave')
                if (autosave) loadProject(autosave)
              }}
              disabled={!savedProjects.find(p => p.id === 'autosave')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Load Auto-save
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const template: ProjectData = {
                  id: generateProjectId(),
                  name: 'Blog Post Template',
                  websiteUrl: '',
                  targetKeywords: 'your, target, keywords',
                  title: 'Your Compelling Blog Post Title',
                  metaDescription: 'A compelling meta description that encourages clicks and describes your content.',
                  content: 'Start writing your human-first content here. Remember to include personal experiences, use simple language, and provide value to your readers.',
                  humanInsights: 'Add your personal insights and experiences here.',
                  sources: '',
                  targetGradeLevel: 8,
                  lastModified: new Date(),
                  wordCount: 0
                }
                loadProject(template)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
