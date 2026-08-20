import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles, Zap, Brain } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateTasksFromPrompt } from '@/api/tasks'
import { toast } from 'sonner'

interface AITaskGeneratorProps {
  triggerClassName?: string
}

export function AITaskGenerator({ triggerClassName }: AITaskGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const qc = useQueryClient()

  const generateMutation = useMutation({
    mutationFn: (input: { prompt: string }) => generateTasksFromPrompt(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks', 'board'] })
      toast.success(`Generated ${data.count} tasks successfully! 🎉`)
      setPrompt('')
      setOpen(false)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to generate tasks'
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }
    generateMutation.mutate({ prompt: prompt.trim() })
  }

  const samplePrompts = [
    "Plan a tech conference for 500 attendees",
    "Organize a product launch event",
    "Set up a corporate training workshop",
    "Create a networking meetup for developers"
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200 hover:from-purple-500/20 hover:to-pink-500/20 dark:border-purple-800 dark:from-purple-500/20 dark:to-pink-500/20 dark:hover:from-purple-500/30 dark:hover:to-pink-500/30 ${triggerClassName}`}
        >
          <Sparkles className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
          AI Generate Tasks
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            AI Task Generator
          </DialogTitle>
          <DialogDescription>
            Describe your event or project, and I'll generate relevant tasks for you automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-medium">
              What would you like to organize? 
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Plan a tech conference for 200 developers with workshops, keynotes, and networking sessions..."
              className="min-h-[100px] resize-none"
              disabled={generateMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about your event type, audience size, and key requirements for better results.
            </p>
          </div>

          {/* Sample Prompts */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Quick Start Examples:
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePrompts.map((sample, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-3 text-left justify-start text-xs bg-muted/50 hover:bg-muted"
                  onClick={() => setPrompt(sample)}
                  disabled={generateMutation.isPending}
                >
                  <Zap className="h-3 w-3 mr-2 flex-shrink-0 text-amber-500" />
                  <span className="truncate">{sample}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={generateMutation.isPending}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!prompt.trim() || generateMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 sm:order-2"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Tasks...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Tasks
                </>
              )}
            </Button>
          </div>
        </form>

        {generateMutation.isPending && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-100 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <div className="absolute inset-0 animate-ping">
                  <Brain className="h-6 w-6 text-purple-600/20 dark:text-purple-400/20" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  AI is working on your request...
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Analyzing your prompt and generating relevant tasks
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}