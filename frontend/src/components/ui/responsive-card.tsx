import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface ResponsiveCardProps {
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
  className?: string
  actions?: ReactNode
}

export function ResponsiveCard({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  className = "",
  actions 
}: ResponsiveCardProps) {
  return (
    <Card className={`group relative overflow-hidden border-border/60 hover:shadow-md transition-all ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-100 transition-opacity pointer-events-none" />
      <CardHeader className=" relative">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          {/* <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold truncate">{title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground line-clamp-2">{description}</CardDescription>
            </div>
          </div> */}
          {actions && (
            <div className="flex-shrink-0 self-start sm:self-center">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative">
        {children}
      </CardContent>
    </Card>
  )
}