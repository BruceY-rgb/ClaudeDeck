import { useState } from 'react'
import { Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react'

interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
}

interface SkillFileTreeProps {
  referenceFiles?: FileNode[]
  templateFiles?: FileNode[]
  onFileSelect?: (path: string) => void
}

interface TreeItemProps {
  node: FileNode
  depth: number
  onSelect?: (path: string) => void
}

function TreeItem({ node, depth, onSelect }: TreeItemProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = node.isDirectory && node.children && node.children.length > 0

  const handleClick = () => {
    if (node.isDirectory) {
      setExpanded(!expanded)
    } else {
      onSelect?.(node.path)
    }
  }

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.isDirectory ? (
          <>
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            )}
            <Folder className="w-4 h-4 text-zinc-400" />
          </>
        ) : (
          <>
            <span className="w-4" />
            <FileText className="w-4 h-4 text-zinc-400" />
          </>
        )}
        <span className="text-sm">{node.name}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map(child => (
            <TreeItem key={child.path} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

export function SkillFileTree({ referenceFiles = [], templateFiles = [], onFileSelect }: SkillFileTreeProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const handleFileSelect = (path: string) => {
    setSelectedFile(path)
    onFileSelect?.(path)
  }

  if (referenceFiles.length === 0 && templateFiles.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {referenceFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Folder className="w-4 h-4" />
            reference/
          </h3>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2">
            {referenceFiles.map(node => (
              <TreeItem key={node.path} node={node} depth={0} onSelect={handleFileSelect} />
            ))}
          </div>
        </div>
      )}

      {templateFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Folder className="w-4 h-4" />
            templates/
          </h3>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2">
            {templateFiles.map(node => (
              <TreeItem key={node.path} node={node} depth={0} onSelect={handleFileSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
