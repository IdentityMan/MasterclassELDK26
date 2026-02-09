import { CopyIcon, Info } from 'lucide-react'
import { Ref } from 'react'
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  duotoneDark,
  duotoneLight,
} from 'react-syntax-highlighter/dist/cjs/styles/prism'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useTheme } from '@/providers/theme-provider'
import { Message } from '@/types/message'
import { toast } from '@/components/ui'

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export function ChatMessage({
  message,
  isStreaming: _isStreaming = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const { theme } = useTheme()

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    toast.success('Message copied to clipboard', 'Copied')
  }

  return (
    <div
      className={cn('mb-4 flex', {
        'justify-end': isUser,
        'justify-start': !isUser,
      })}
    >
      <div
        className={cn('group rounded-lg-xl relative', {
          'bg-muted text-primary-foreground max-w-[80%] rounded-4xl px-4':
            isUser,
          'bg-background max-w-full': !isUser,
        })}
        style={{ isolation: 'auto' }}
      >
        <div
          className={cn(
            'prose prose-sm text-foreground relative max-w-none transition-opacity',
            {
              'min-h-[20px]': message.role === 'assistant' && !isUser,
            }
          )}
          style={{ zIndex: 1 }}
        >
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            components={{
              h1: ({ ...props }) => (
                <h1 className="mt-3 mb-2 text-xl font-bold" {...props} />
              ),
              h2: ({ ...props }) => (
                <h2 className="mt-3 mb-2 text-lg font-bold" {...props} />
              ),
              h3: ({ ...props }) => (
                <h3 className="text-md mt-3 mb-2 font-bold" {...props} />
              ),
              p: ({ ...props }) => <p className="my-2" {...props} />,
              a: ({ ...props }) => (
                <a
                  className="text-foreground hover:text-muted-foreground underline underline-offset-6"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              ul: ({ children, ...props }) => (
                <ul className="my-2 list-none pl-4" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ ...props }) => (
                <ol className="my-2 list-none pl-5" {...props} />
              ),
              li: ({ children, ...props }) => (
                <li className="chat relative my-1" {...props}>
                  {children}
                </li>
              ),
              blockquote: ({ ...props }) => (
                <blockquote
                  className="border-border my-2 border-l-4 pl-4 italic"
                  {...props}
                />
              ),
              // @ts-expect-error - Code component has specific props from react-markdown
              code({
                ref,
                className,
                children,
                inline,
                ...props
              }: {
                ref: Ref<SyntaxHighlighter> | undefined
                className: string
                children: React.ReactNode
                inline: boolean
              }) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <div className="relative">
                    <SyntaxHighlighter
                      ref={ref}
                      style={theme === 'light' ? duotoneLight : duotoneDark}
                      showLineNumbers={true}
                      wrapLines={true}
                      wrapLongLines={true}
                      lineNumberStyle={{ fontStyle: 'unset' }}
                      language={match[1]}
                      PreTag="div"
                      className="border-border outline-border !my-3 max-w-full overflow-clip rounded-xl border font-mono text-sm text-wrap shadow-md outline outline-offset-2"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                    <Button
                      variant="outline"
                      className="hover:bg-background absolute top-2 right-2 h-7 cursor-pointer rounded-lg p-1"
                      onClick={handleCopy}
                      title="Copy to clipboard"
                    >
                      <CopyIcon className="text-foreground size-4" />
                    </Button>
                  </div>
                ) : (
                  <code
                    className={cn(
                      'bg-muted/25 border-border/80 rounded-md border px-1 py-0.5 font-mono text-xs text-wrap shadow-[0_1px_2px_-1px_rgba(0,0,0,0.16)]',
                      className
                    )}
                    {...props}
                  >
                    {String(children).trimStart().trimEnd()}
                  </code>
                )
              },
              table: ({ ...props }) => (
                <div className="border-border shadow-bevel-xs my-4 overflow-x-auto rounded-xl border">
                  <table
                    className="divide-border min-w-full divide-y text-sm"
                    {...props}
                  />
                </div>
              ),
              th: ({ ...props }) => (
                <th
                  className="bg-muted/50 px-2.5 py-1.5 text-left text-xs font-semibold"
                  {...props}
                />
              ),
              td: ({ ...props }) => (
                <td
                  className="border-border border-t px-2.5 py-1.5"
                  {...props}
                />
              ),
              img: ({ ...props }) => (
                <div className="border-border bg-card flex max-w-[30%] flex-col gap-1 rounded-xl border p-1">
                  <img
                    className="border-border rounded-lg border shadow-md"
                    {...props}
                  />
                  <caption className="flex w-full items-center gap-1 px-1 py-1 text-left text-xs">
                    <span className="bg-muted rounded-full p-1">
                      <Info className="size-4" />
                    </span>
                    {props!.alt}
                  </caption>
                </div>
              ),
              hr: ({ ...props }) => (
                <hr className="border-border my-4 w-full" {...props} />
              ),
            }}
          >
            {message.content}
          </Markdown>
        </div>
      </div>
    </div>
  )
}
